// ============================================================
//  lib.cairo — contract entry point
//
//  Responsibilities:
//    - Storage declarations
//    - Constructor / initializer guard
//    - Dispatches every external call to escrow.cairo logic
//    - Emits events
//    - Index management (buyer/farmer order lists)
//
//  No business logic lives here. This file wires storage ↔ logic.
// ============================================================

pub mod escrow;
pub mod interface;
#[cfg(test)]
mod tests;
pub mod types;
use starknet::storage::{Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess};
use starknet::{ContractAddress, get_caller_address};
use crate::escrow::{build_order, complete_order, expire_order};
use crate::interface::IEscrow;
use crate::types::{EscrowError, Order, OrderCompleted, OrderCreated, OrderRefunded};

// ── Contract
// ─────────────────────────────────────────────────
#[starknet::contract]
mod EscrowContract {
    use super::*;

    // ── Storage
    // ──────────────────────────────────────────────
    #[storage]
    struct Storage {
        // Set once in initialize()
        admin: ContractAddress,
        fee_collector: ContractAddress,
        initialized: bool,
        // Supported payment tokens
        supported_tokens: Map<u32, ContractAddress>,
        supported_tokens_len: u32,
        // Orders
        order_count: u64,
        orders: Map<u64, Order>,
        // Indexes: address → length + (address, index) → order_id
        buyer_orders_len: Map<ContractAddress, u64>,
        buyer_orders: Map<(ContractAddress, u64), u64>,
        farmer_orders_len: Map<ContractAddress, u64>,
        farmer_orders: Map<(ContractAddress, u64), u64>,
    }

    // ── Events
    // ────────────────────────────────────────────────
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        OrderCreated: OrderCreated,
        OrderCompleted: OrderCompleted,
        OrderRefunded: OrderRefunded,
    }

    // ── Constructor
    // ───────────────────────────────────────────
    #[constructor]
    fn constructor(
        ref self: ContractState,
    ) { // Intentionally empty — call initialize() after deployment.
    }

    // ── IEscrow implementation
    // ────────────────────────────────
    #[abi(embed_v0)]
    impl EscrowImpl of IEscrow<ContractState> {
        // ── Initialize
        // ────────────────────────────────────────
        fn initialize(
            ref self: ContractState,
            admin: ContractAddress,
            supported_tokens: Array<ContractAddress>,
            fee_collector: ContractAddress,
        ) -> Result<(), EscrowError> {
            if self.initialized.read() {
                return Result::Err(EscrowError::AlreadyInitialized);
            }
            if supported_tokens.len() < 2 {
                return Result::Err(EscrowError::MustSupportTwoTokens);
            }

            self.admin.write(admin);
            self.fee_collector.write(fee_collector);
            self.initialized.write(true);

            let len = supported_tokens.len();
            let mut i: u32 = 0;
            while i < len {
                self.supported_tokens.entry(i).write(*supported_tokens.at(i));
                i += 1;
            }
            self.supported_tokens_len.write(len);

            Result::Ok(())
        }

        // ── Create order
        // ──────────────────────────────────────
        fn create_order(
            ref self: ContractState,
            buyer: ContractAddress,
            farmer: ContractAddress,
            token: ContractAddress,
            amount: u256,
        ) -> Result<u64, EscrowError> {
            assert(get_caller_address() == buyer, 'Caller must be buyer');

            if !self.initialized.read() {
                return Result::Err(EscrowError::ContractNotInitialized);
            }

            let tokens_snapshot = self._load_supported_tokens();
            let fee_collector = self.fee_collector.read();

            let (order, net_amount, fee_amount) = build_order(
                buyer, farmer, token, amount, @tokens_snapshot, fee_collector,
            )?;

            let order_id = self.order_count.read() + 1;
            self.order_count.write(order_id);

            self.orders.entry(order_id).write(order);

            // Update buyer index
            let buyer_len = self.buyer_orders_len.entry(buyer).read();
            self.buyer_orders.entry((buyer, buyer_len)).write(order_id);
            self.buyer_orders_len.entry(buyer).write(buyer_len + 1);

            // Update farmer index
            let farmer_len = self.farmer_orders_len.entry(farmer).read();
            self.farmer_orders.entry((farmer, farmer_len)).write(order_id);
            self.farmer_orders_len.entry(farmer).write(farmer_len + 1);

            self.emit(OrderCreated { order_id, buyer, farmer, token, net_amount, fee_amount });

            Result::Ok(order_id)
        }

        // ── Confirm receipt
        // ───────────────────────────────────
        fn confirm_receipt(
            ref self: ContractState, buyer: ContractAddress, order_id: u64,
        ) -> Result<(), EscrowError> {
            assert(get_caller_address() == buyer, 'Caller must be buyer');

            let order = self._get_order(order_id)?;
            let farmer = order.farmer;
            let amount = order.amount;

            let updated = complete_order(order, buyer)?;
            self.orders.entry(order_id).write(updated);

            self.emit(OrderCompleted { order_id, farmer, amount });
            Result::Ok(())
        }

        // ── Refund expired order
        // ──────────────────────────────
        fn refund_expired_order(ref self: ContractState, order_id: u64) -> Result<(), EscrowError> {
            let order = self._get_order(order_id)?;
            let buyer = order.buyer;
            let amount = order.amount;

            let updated = expire_order(order)?;
            self.orders.entry(order_id).write(updated);

            self.emit(OrderRefunded { order_id, buyer, amount });
            Result::Ok(())
        }

        // ── Batch refund
        // ──────────────────────────────────────
        fn refund_expired_orders(
            ref self: ContractState, order_ids: Array<u64>,
        ) -> Result<(), EscrowError> {
            let mut i = 0;
            let len = order_ids.len();
            loop {
                if i == len {
                    break Result::Ok(());
                }
                let result = self.refund_expired_order(*order_ids.at(i));
                if result.is_err() {
                    break result;
                }
                i += 1;
            }
        }

        // ── View: order details
        // ───────────────────────────────
        fn get_order_details(self: @ContractState, order_id: u64) -> Result<Order, EscrowError> {
            self._get_order(order_id)
        }

        // ── View: buyer orders
        // ────────────────────────────────
        // Cairo storage Maps cannot be passed as function parameters.
        // All Map access must go through `self` directly — hence inlined.
        fn get_orders_by_buyer(self: @ContractState, buyer: ContractAddress) -> Array<u64> {
            let len = self.buyer_orders_len.entry(buyer).read();
            let mut arr: Array<u64> = array![];
            let mut i: u64 = 0;
            while i < len {
                arr.append(self.buyer_orders.entry((buyer, i)).read());
                i += 1;
            }
            arr
        }

        // ── View: farmer orders
        // ───────────────────────────────
        fn get_orders_by_farmer(self: @ContractState, farmer: ContractAddress) -> Array<u64> {
            let len = self.farmer_orders_len.entry(farmer).read();
            let mut arr: Array<u64> = array![];
            let mut i: u64 = 0;
            while i < len {
                arr.append(self.farmer_orders.entry((farmer, i)).read());
                i += 1;
            }
            arr
        }

        // ── View: supported tokens
        // ────────────────────────────
        fn get_supported_tokens(self: @ContractState) -> Array<ContractAddress> {
            self._load_supported_tokens()
        }

        // ── View: fee collector
        // ───────────────────────────────
        fn get_fee_collector(self: @ContractState) -> ContractAddress {
            self.fee_collector.read()
        }

        // ── View: order count
        // ─────────────────────────────────
        fn get_order_count(self: @ContractState) -> u64 {
            self.order_count.read()
        }
    }

    // ── Private helpers
    // ───────────────────────────────────────
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _get_order(self: @ContractState, order_id: u64) -> Result<Order, EscrowError> {
            if order_id == 0 || order_id > self.order_count.read() {
                return Result::Err(EscrowError::OrderDoesNotExist);
            }
            Result::Ok(self.orders.entry(order_id).read())
        }

        // Supported tokens CAN be loaded into a plain Array and passed around
        // freely — Array<ContractAddress> is a normal value type, not storage.
        fn _load_supported_tokens(self: @ContractState) -> Array<ContractAddress> {
            let len = self.supported_tokens_len.read();
            let mut arr: Array<ContractAddress> = array![];
            let mut i: u32 = 0;
            while i < len {
                arr.append(self.supported_tokens.entry(i).read());
                i += 1;
            }
            arr
        }
    }
}
