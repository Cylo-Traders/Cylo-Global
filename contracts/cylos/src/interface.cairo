// ============================================================
//  interface.cairo — public ABI trait
// ============================================================

use starknet::ContractAddress;
use crate::types::{EscrowError, Order, Resolution};

#[starknet::interface]
pub trait IEscrow<TContractState> {

    // ── Setup ─────────────────────────────────────────────────

    /// Deploy-time initializer. Can only be called once.
    /// `fee_collector` receives 3% of every order's amount.
    /// `arbitrator` is the address empowered to rule on disputes.
    fn initialize(
        ref self: TContractState,
        admin: ContractAddress,
        arbitrator: ContractAddress,
        supported_tokens: Array<ContractAddress>,
        fee_collector: ContractAddress,
    ) -> Result<(), EscrowError>;

    // ── Core order lifecycle ──────────────────────────────────

    /// Lock caller's funds, deduct 3% fee immediately, return new order_id.
    /// The buyer is always `get_caller_address()` — no redundant arg.
    /// `expiry_seconds` is configurable per order; pass 0 to use default (96h).
    /// `order_ref` is an opaque caller-supplied reference (typically the
    /// backend's DB UUID as a felt252); emitted verbatim in OrderCreated so
    /// the indexer can exact-match. Pass 0 to opt out.
    fn create_order(
        ref self: TContractState,
        farmer: ContractAddress,
        token: ContractAddress,
        amount: u256,
        expiry_seconds: u64,
        order_ref: felt252,
    ) -> Result<u64, EscrowError>;

    /// Buyer confirms receipt → releases net_amount to farmer.
    /// Caller must be the order's buyer.
    fn confirm_receipt(
        ref self: TContractState,
        order_id: u64,
    ) -> Result<(), EscrowError>;

    /// Anyone may call once expiry_seconds have elapsed → refunds net_amount to buyer.
    fn refund_expired_order(
        ref self: TContractState,
        order_id: u64,
    ) -> Result<(), EscrowError>;

    /// Batch version of refund_expired_order.
    fn refund_expired_orders(
        ref self: TContractState,
        order_ids: Array<u64>,
    ) -> Result<(), EscrowError>;

    // ── Dispute resolution ────────────────────────────────────

    /// Either the buyer or farmer may raise a dispute on a Pending order.
    /// Order must not have expired yet.
    /// Transitions order to DisputeOpen — freezes funds until arbitrator rules.
    fn raise_dispute(
        ref self: TContractState,
        order_id: u64,
    ) -> Result<(), EscrowError>;

    /// Arbitrator rules on a DisputeOpen order.
    /// Resolution::Split requires farmer_split_bps (0–10000 basis points).
    ///   e.g. farmer_split_bps = 6000 → farmer gets 60%, buyer gets 40%
    /// Resolution::ReleasedToFarmer and Resolution::RefundedToBuyer ignore farmer_split_bps.
    fn rule_dispute(
        ref self: TContractState,
        order_id: u64,
        resolution: Resolution,
        farmer_split_bps: u16,
    ) -> Result<(), EscrowError>;

    // ── Admin ─────────────────────────────────────────────────

    /// Update the arbitrator address. Only callable by admin.
    fn update_arbitrator(
        ref self: TContractState,
        new_arbitrator: ContractAddress,
    ) -> Result<(), EscrowError>;

    // ── View functions ────────────────────────────────────────
    fn get_order_details(self: @TContractState, order_id: u64) -> Result<Order, EscrowError>;
    fn get_orders_by_buyer(self: @TContractState, buyer: ContractAddress) -> Array<u64>;
    fn get_orders_by_farmer(self: @TContractState, farmer: ContractAddress) -> Array<u64>;
    fn get_supported_tokens(self: @TContractState) -> Array<ContractAddress>;
    fn get_fee_collector(self: @TContractState) -> ContractAddress;
    fn get_arbitrator(self: @TContractState) -> ContractAddress;
    fn get_order_count(self: @TContractState) -> u64;
}
