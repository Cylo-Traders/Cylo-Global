// ============================================================
//  escrow.cairo — pure business logic
//
//  This module contains no storage declarations. It receives
//  all state it needs via function parameters (storage refs /
//  snapshots injected by lib.cairo). This keeps logic fully
//  unit-testable independent of the contract harness.
// ============================================================

use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use starknet::{ContractAddress, get_block_timestamp, get_contract_address};
use crate::types::{
    EscrowError, FEE_DENOMINATOR, FEE_NUMERATOR, NINETY_SIX_HOURS_IN_SECONDS, Order, OrderStatus,
};

// ── Fee helpers
// ──────────────────────────────────────────────

/// Returns (fee_amount, net_amount) for a given gross amount.
/// fee  = amount * 3 / 100  (integer division — rounds down)
/// net  = amount - fee
pub fn compute_fee(amount: u256) -> (u256, u256) {
    let fee = amount * FEE_NUMERATOR / FEE_DENOMINATOR;
    let net = amount - fee;
    (fee, net)
}

// ── Token helpers
// ────────────────────────────────────────────

/// Transfer `amount` of `token` from `from` → `to`.
/// Uses transferFrom (requires prior approval from `from`).
pub fn transfer_from(
    token: ContractAddress, from: ContractAddress, to: ContractAddress, amount: u256,
) {
    let erc20 = IERC20Dispatcher { contract_address: token };
    erc20.transfer_from(from, to, amount);
}

/// Transfer `amount` of `token` from the escrow contract → `to`.
pub fn transfer_out(token: ContractAddress, to: ContractAddress, amount: u256) {
    let erc20 = IERC20Dispatcher { contract_address: token };
    erc20.transfer(to, amount);
}

// ── Core operations
// ──────────────────────────────────────────

/// Validates inputs, pulls funds from buyer, splits fee, and
/// returns a fully constructed `Order` (net amount stored).
///
/// Caller (lib.cairo) is responsible for:
///   - persisting the returned Order
///   - incrementing order_id counter
///   - updating buyer/farmer index lists
pub fn build_order(
    buyer: ContractAddress,
    farmer: ContractAddress,
    token: ContractAddress,
    amount: u256,
    supported_tokens: @Array<ContractAddress>,
    fee_collector: ContractAddress,
) -> Result<(Order, u256, u256), EscrowError> {
    // ── Guards
    // ───────────────────────────────────────────────
    if amount == 0 {
        return Result::Err(EscrowError::AmountMustBePositive);
    }

    if !is_supported_token(token, supported_tokens) {
        return Result::Err(EscrowError::UnsupportedToken);
    }

    // ── Pull full amount from buyer into escrow ──────────────
    // Buyer must have called token.approve(escrow_address, amount) beforehand.
    let escrow = get_contract_address();
    transfer_from(token, buyer, escrow, amount);

    // ── Deduct 3% fee immediately
    // ────────────────────────────
    let (fee_amount, net_amount) = compute_fee(amount);
    transfer_out(token, fee_collector, fee_amount);

    // ── Build the order record (stores net amount only) ──────
    let order = Order {
        buyer,
        farmer,
        token,
        amount: net_amount, // only 97% is locked for the farmer
        timestamp: get_block_timestamp(),
        status: OrderStatus::Pending,
    };

    Result::Ok((order, net_amount, fee_amount))
}

/// Validates and completes an order, releasing net_amount to farmer.
/// Returns the mutated Order ready to be re-persisted.
pub fn complete_order(mut order: Order, caller: ContractAddress) -> Result<Order, EscrowError> {
    if order.buyer != caller {
        return Result::Err(EscrowError::NotBuyer);
    }
    if order.status != OrderStatus::Pending {
        return Result::Err(EscrowError::OrderNotPending);
    }

    order.status = OrderStatus::Completed;
    transfer_out(order.token, order.farmer, order.amount);

    Result::Ok(order)
}

/// Validates expiry and refunds net_amount to buyer.
/// Returns the mutated Order ready to be re-persisted.
pub fn expire_order(mut order: Order) -> Result<Order, EscrowError> {
    if order.status != OrderStatus::Pending {
        return Result::Err(EscrowError::OrderNotPending);
    }

    let now = get_block_timestamp();
    if now <= order.timestamp + NINETY_SIX_HOURS_IN_SECONDS {
        return Result::Err(EscrowError::OrderNotExpired);
    }

    order.status = OrderStatus::Refunded;
    transfer_out(order.token, order.buyer, order.amount);

    Result::Ok(order)
}

// ── Internal utility
// ─────────────────────────────────────────

fn is_supported_token(token: ContractAddress, supported: @Array<ContractAddress>) -> bool {
    let mut i = 0;
    let len = supported.len();
    loop {
        if i == len {
            break false;
        }
        if *supported.at(i) == token {
            break true;
        }
        i += 1;
    }
}
