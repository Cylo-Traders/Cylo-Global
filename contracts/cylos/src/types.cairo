// ============================================================
//  types.cairo — shared data structures, enums, and errors
// ============================================================

use starknet::ContractAddress;

// ── Order status
// ────────────────────────────────────────────
#[derive(Copy, Drop, Serde, starknet::Store, PartialEq)]
#[allow(starknet::store_no_default_variant)]
pub enum OrderStatus {
    Pending,
    Completed,
    Refunded,
}

// ── Core order record
// ────────────────────────────────────────
#[derive(Copy, Drop, Serde, starknet::Store)]
pub struct Order {
    pub buyer: ContractAddress,
    pub farmer: ContractAddress,
    pub token: ContractAddress,
    pub amount: u256, // net amount (after 3% fee deducted)
    pub timestamp: u64,
    pub status: OrderStatus,
}

// ── Contract errors
// ──────────────────────────────────────────
#[derive(Copy, Drop, Serde, PartialEq)]
pub enum EscrowError {
    AlreadyInitialized,
    MustSupportTwoTokens,
    AmountMustBePositive,
    ContractNotInitialized,
    UnsupportedToken,
    OrderDoesNotExist,
    NotBuyer,
    OrderNotPending,
    OrderNotExpired,
    TokenTransferFailed,
}

// ── Events
// ───────────────────────────────────────────────────
#[derive(Copy, Drop, starknet::Event)]
pub struct OrderCreated {
    #[key]
    pub order_id: u64,
    pub buyer: ContractAddress,
    pub farmer: ContractAddress,
    pub token: ContractAddress,
    pub net_amount: u256,
    pub fee_amount: u256,
}

#[derive(Copy, Drop, starknet::Event)]
pub struct OrderCompleted {
    #[key]
    pub order_id: u64,
    pub farmer: ContractAddress,
    pub amount: u256,
}

#[derive(Copy, Drop, starknet::Event)]
pub struct OrderRefunded {
    #[key]
    pub order_id: u64,
    pub buyer: ContractAddress,
    pub amount: u256,
}

// ── Constants
// ────────────────────────────────────────────────
pub const NINETY_SIX_HOURS_IN_SECONDS: u64 = 96 * 60 * 60;
pub const FEE_NUMERATOR: u256 = 3;
pub const FEE_DENOMINATOR: u256 = 100;
