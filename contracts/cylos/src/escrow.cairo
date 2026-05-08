// ============================================================
//  escrow.cairo — pure business logic
// ============================================================

use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use starknet::{ContractAddress, get_block_timestamp, get_contract_address};
use crate::types::{
    EscrowError, FEE_DENOMINATOR, FEE_NUMERATOR, MAX_BPS,
    MAX_EXPIRY_SECONDS, MIN_EXPIRY_SECONDS, DEFAULT_EXPIRY_SECONDS,
    Order, OrderStatus, Resolution,
};

// ── Fee helpers ───────────────────────────────────────────────

/// fee = amount * 3 / 100 (integer division, rounds down)
/// Invariant: fee + net == amount always holds.
pub fn compute_fee(amount: u256) -> (u256, u256) {
    let fee = amount * FEE_NUMERATOR / FEE_DENOMINATOR;
    let net = amount - fee;
    (fee, net)
}

/// farmer_split_bps = 6000 → farmer 60%, buyer 40%
/// Invariant: farmer_amount + buyer_amount == net_amount always holds.
pub fn compute_split(net_amount: u256, farmer_split_bps: u16) -> (u256, u256) {
    let farmer_amount = net_amount * farmer_split_bps.into() / MAX_BPS.into();
    let buyer_amount = net_amount - farmer_amount;
    (farmer_amount, buyer_amount)
}

// ── Token helpers ─────────────────────────────────────────────
//
// Both helpers check the ERC20 return bool. OpenZeppelin ERC20s revert on
// failure — but non-compliant tokens can return false without reverting,
// which would otherwise leave the escrow thinking funds moved when they
// didn't. Bubble TokenTransferFailed instead.

pub fn transfer_from(
    token: ContractAddress,
    from: ContractAddress,
    to: ContractAddress,
    amount: u256,
) -> Result<(), EscrowError> {
    let erc20 = IERC20Dispatcher { contract_address: token };
    let ok = erc20.transfer_from(from, to, amount);
    if !ok {
        return Result::Err(EscrowError::TokenTransferFailed);
    }
    Result::Ok(())
}

pub fn transfer_out(
    token: ContractAddress,
    to: ContractAddress,
    amount: u256,
) -> Result<(), EscrowError> {
    let erc20 = IERC20Dispatcher { contract_address: token };
    let ok = erc20.transfer(to, amount);
    if !ok {
        return Result::Err(EscrowError::TokenTransferFailed);
    }
    Result::Ok(())
}

// ── Core operations ───────────────────────────────────────────

/// Validate inputs, pull funds from buyer, deduct fee, return Order.
/// expiry_seconds = 0 → use DEFAULT_EXPIRY_SECONDS (96h).
/// order_ref = 0 means "no caller-supplied reference".
pub fn build_order(
    buyer: ContractAddress,
    farmer: ContractAddress,
    token: ContractAddress,
    amount: u256,
    expiry_seconds: u64,
    order_ref: felt252,
    supported_tokens: @Array<ContractAddress>,
    fee_collector: ContractAddress,
) -> Result<(Order, u256, u256), EscrowError> {
    if amount == 0 {
        return Result::Err(EscrowError::AmountMustBePositive);
    }

    if !is_supported_token(token, supported_tokens) {
        return Result::Err(EscrowError::UnsupportedToken);
    }

    let resolved_expiry = if expiry_seconds == 0 {
        DEFAULT_EXPIRY_SECONDS
    } else {
        expiry_seconds
    };

    if resolved_expiry < MIN_EXPIRY_SECONDS || resolved_expiry > MAX_EXPIRY_SECONDS {
        return Result::Err(EscrowError::InvalidExpiry);
    }

    let escrow = get_contract_address();
    transfer_from(token, buyer, escrow, amount)?;

    let (fee_amount, net_amount) = compute_fee(amount);
    transfer_out(token, fee_collector, fee_amount)?;

    let zero_address: ContractAddress = 0.try_into().unwrap();
    let order = Order {
        buyer,
        farmer,
        token,
        amount: net_amount,
        timestamp: get_block_timestamp(),
        expiry_seconds: resolved_expiry,
        status: OrderStatus::Pending,
        disputed_by: zero_address,
        dispute_timestamp: 0,
        farmer_split_bps: 0,
        order_ref,
    };

    Result::Ok((order, net_amount, fee_amount))
}

/// Buyer confirms receipt — releases net_amount to farmer.
pub fn complete_order(
    mut order: Order,
    caller: ContractAddress,
) -> Result<Order, EscrowError> {
    if order.buyer != caller {
        return Result::Err(EscrowError::NotBuyer);
    }
    if order.status != OrderStatus::Pending {
        return Result::Err(EscrowError::OrderNotPending);
    }
    order.status = OrderStatus::Completed;
    transfer_out(order.token, order.farmer, order.amount)?;
    Result::Ok(order)
}

/// Auto-refund expired order — permissionless.
pub fn expire_order(mut order: Order) -> Result<Order, EscrowError> {
    if order.status != OrderStatus::Pending {
        return Result::Err(EscrowError::OrderNotPending);
    }
    let now = get_block_timestamp();
    if now <= order.timestamp + order.expiry_seconds {
        return Result::Err(EscrowError::OrderNotExpired);
    }
    order.status = OrderStatus::Refunded;
    transfer_out(order.token, order.buyer, order.amount)?;
    Result::Ok(order)
}

/// Either party raises a dispute on a Pending, non-expired order.
pub fn open_dispute(
    mut order: Order,
    caller: ContractAddress,
) -> Result<Order, EscrowError> {
    if caller != order.buyer && caller != order.farmer {
        return Result::Err(EscrowError::NotParty);
    }
    if order.status != OrderStatus::Pending {
        return Result::Err(EscrowError::OrderNotPending);
    }
    let now = get_block_timestamp();
    if now > order.timestamp + order.expiry_seconds {
        return Result::Err(EscrowError::DisputeWindowClosed);
    }
    order.status = OrderStatus::DisputeOpen;
    order.disputed_by = caller;
    order.dispute_timestamp = now;
    Result::Ok(order)
}

/// Arbitrator rules on a DisputeOpen order.
pub fn resolve_dispute(
    mut order: Order,
    caller: ContractAddress,
    arbitrator: ContractAddress,
    resolution: Resolution,
    farmer_split_bps: u16,
) -> Result<(Order, u256, u256), EscrowError> {
    if caller != arbitrator {
        return Result::Err(EscrowError::NotArbitrator);
    }
    if order.status != OrderStatus::DisputeOpen {
        return Result::Err(EscrowError::OrderNotDisputed);
    }
    if resolution == Resolution::Split && farmer_split_bps > MAX_BPS {
        return Result::Err(EscrowError::InvalidSplitBps);
    }

    let (farmer_amount, buyer_amount) = match resolution {
        Resolution::ReleasedToFarmer => (order.amount, 0_u256),
        Resolution::RefundedToBuyer  => (0_u256, order.amount),
        Resolution::Split            => compute_split(order.amount, farmer_split_bps),
    };

    if farmer_amount > 0 {
        transfer_out(order.token, order.farmer, farmer_amount)?;
    }
    if buyer_amount > 0 {
        transfer_out(order.token, order.buyer, buyer_amount)?;
    }

    order.status = OrderStatus::DisputeResolved;
    order.farmer_split_bps = farmer_split_bps;
    Result::Ok((order, farmer_amount, buyer_amount))
}

// ── Internal ──────────────────────────────────────────────────

fn is_supported_token(
    token: ContractAddress,
    supported: @Array<ContractAddress>,
) -> bool {
    let mut i = 0;
    let len = supported.len();
    loop {
        if i == len { break false; }
        if *supported.at(i) == token { break true; }
        i += 1;
    }
}
