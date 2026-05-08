// ============================================================
//  types.cairo — shared data structures, enums, and errors
// ============================================================

use starknet::ContractAddress;

// ── Order status ─────────────────────────────────────────────
#[derive(Copy, Drop, Serde, starknet::Store, PartialEq)]
#[allow(starknet::store_no_default_variant)]
pub enum OrderStatus {
    Pending,
    Completed,
    Refunded,
    DisputeOpen,
    DisputeResolved,
}

// ── Resolution direction ──────────────────────────────────────
#[derive(Copy, Drop, Serde, starknet::Store, PartialEq)]
#[allow(starknet::store_no_default_variant)]
pub enum Resolution {
    ReleasedToFarmer,
    RefundedToBuyer,
    Split,
}

// ── Core order record ─────────────────────────────────────────
#[derive(Copy, Drop, Serde, starknet::Store)]
pub struct Order {
    pub buyer: ContractAddress,
    pub farmer: ContractAddress,
    pub token: ContractAddress,
    pub amount: u256,
    pub timestamp: u64,
    pub expiry_seconds: u64,
    pub status: OrderStatus,
    pub disputed_by: ContractAddress,
    pub dispute_timestamp: u64,
    pub farmer_split_bps: u16,
    /// Caller-supplied reference (typically the backend's DB order UUID as a
    /// felt). Emitted verbatim in OrderCreated so the indexer can do an exact
    /// match without fuzzy logic. Pass 0 to opt out.
    pub order_ref: felt252,
}

// ── Contract errors ───────────────────────────────────────────
#[derive(Copy, Drop, Serde, PartialEq)]
pub enum EscrowError {
    AlreadyInitialized,
    MustSupportTwoTokens,
    AmountMustBePositive,
    InvalidExpiry,            // expiry outside min/max bounds
    ContractNotInitialized,
    UnsupportedToken,
    OrderDoesNotExist,
    NotBuyer,
    NotParty,
    NotArbitrator,
    OrderNotPending,
    OrderNotExpired,
    OrderNotDisputed,
    AlreadyDisputed,
    InvalidSplitBps,
    DisputeWindowClosed,
    TokenTransferFailed,
}

// ── Events ────────────────────────────────────────────────────
#[derive(Copy, Drop, starknet::Event)]
pub struct OrderCreated {
    #[key]
    pub order_id: u64,
    /// Caller-supplied reference (DB UUID as felt252). Indexer uses this for
    /// exact order matching. Zero if the caller didn't provide one.
    pub order_ref: felt252,
    pub buyer: ContractAddress,
    pub farmer: ContractAddress,
    pub token: ContractAddress,
    pub net_amount: u256,
    pub fee_amount: u256,
    pub expiry_seconds: u64,
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

#[derive(Copy, Drop, starknet::Event)]
pub struct DisputeRaised {
    #[key]
    pub order_id: u64,
    pub raised_by: ContractAddress,
    pub timestamp: u64,
}

#[derive(Copy, Drop, starknet::Event)]
pub struct DisputeRuled {
    #[key]
    pub order_id: u64,
    pub arbitrator: ContractAddress,
    pub resolution: Resolution,
    pub farmer_amount: u256,
    pub buyer_amount: u256,
}

// ── Constants ─────────────────────────────────────────────────
pub const DEFAULT_EXPIRY_SECONDS: u64 = 96 * 60 * 60;
pub const MIN_EXPIRY_SECONDS: u64 = 24 * 60 * 60;
pub const MAX_EXPIRY_SECONDS: u64 = 30 * 24 * 60 * 60;
pub const FEE_NUMERATOR: u256 = 3;
pub const FEE_DENOMINATOR: u256 = 100;
pub const MAX_BPS: u16 = 10000;
