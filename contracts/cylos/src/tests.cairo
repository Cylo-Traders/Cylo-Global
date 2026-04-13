// ============================================================
//  tests.cairo — full test suite for escrow v2
//
//  All dispatchers are rebuilt from ContractAddress at each
//  call site to satisfy Cairo's ownership model (no Copy on
//  dispatchers). All assert messages are <= 31 chars.
//
//  Sections:
//    1.  Pure fee logic
//    2.  Pure split logic
//    3.  initialize()
//    4.  Empty index state
//    5.  create_order() guards
//    6.  confirm_receipt() guards
//    7.  refund_expired_order() guards
//    8.  raise_dispute() guards
//    9.  rule_dispute() guards
//   10.  update_arbitrator() guards
//   11.  Full flow: create → confirm
//   12.  Full flow: create → expire → refund
//   13.  Full flow: dispute → farmer wins
//   14.  Full flow: dispute → buyer wins
//   15.  Full flow: dispute → split ruling
//   16.  Custom expiry
//   17.  Arbitrator rotation
// ============================================================

#[cfg(test)]
mod tests {
    use cylos::escrow::{compute_fee, compute_split};
    use cylos::interface::{IEscrowDispatcher, IEscrowDispatcherTrait};
    use cylos::mock_erc20::{IMockERC20Dispatcher, IMockERC20DispatcherTrait};
    use cylos::types::{EscrowError, Resolution};
    use snforge_std::{
        ContractClassTrait, DeclareResultTrait, declare,
        start_cheat_caller_address, stop_cheat_caller_address,
        start_cheat_block_timestamp_global, stop_cheat_block_timestamp_global,
    };
    use starknet::{ContractAddress, SyscallResultTrait};

    // ── Address helpers ───────────────────────────────────────
    fn admin() -> ContractAddress { 1.try_into().unwrap() }
    fn fee_collector() -> ContractAddress { 2.try_into().unwrap() }
    fn buyer() -> ContractAddress { 3.try_into().unwrap() }
    fn farmer() -> ContractAddress { 4.try_into().unwrap() }
    fn arbitrator() -> ContractAddress { 5.try_into().unwrap() }
    fn token_b_addr() -> ContractAddress { 6.try_into().unwrap() }
    fn stranger() -> ContractAddress { 7.try_into().unwrap() }
    fn new_arbitrator() -> ContractAddress { 8.try_into().unwrap() }

    // ── Dispatcher constructors ───────────────────────────────
    // ContractAddress is Copy — store addresses, rebuild dispatchers
    // at each call site to satisfy Cairo's ownership model.

    fn escrow_at(a: ContractAddress) -> IEscrowDispatcher {
        IEscrowDispatcher { contract_address: a }
    }

    fn token_at(a: ContractAddress) -> IMockERC20Dispatcher {
        IMockERC20Dispatcher { contract_address: a }
    }

    // ── Deploy helpers ────────────────────────────────────────

    fn deploy_mock_erc20() -> ContractAddress {
        let c = declare("MockERC20").unwrap_syscall().contract_class();
        let (addr, _) = c.deploy(@array![]).unwrap_syscall();
        addr
    }

    fn deploy_escrow() -> ContractAddress {
        let c = declare("EscrowContract").unwrap_syscall().contract_class();
        let (addr, _) = c.deploy(@array![]).unwrap_syscall();
        addr
    }

    /// Deploy + initialize. Returns (escrow_addr, token_addr).
    fn setup() -> (ContractAddress, ContractAddress) {
        let escrow_addr = deploy_escrow();
        let token_addr = deploy_mock_erc20();
        escrow_at(escrow_addr)
            .initialize(
                admin(), arbitrator(),
                array![token_addr, token_b_addr()],
                fee_collector(),
            )
            .unwrap();
        (escrow_addr, token_addr)
    }

    /// Mint → approve → create_order with default expiry (0).
    fn create_funded_order(
        escrow_addr: ContractAddress,
        token_addr: ContractAddress,
        amount: u256,
    ) -> u64 {
        token_at(token_addr).mint(buyer(), amount);

        start_cheat_caller_address(token_addr, buyer());
        token_at(token_addr).approve(escrow_addr, amount);
        stop_cheat_caller_address(token_addr);

        start_cheat_caller_address(escrow_addr, buyer());
        let id = escrow_at(escrow_addr)
            .create_order(buyer(), farmer(), token_addr, amount, 0)
            .unwrap();
        stop_cheat_caller_address(escrow_addr);
        id
    }

    /// Same but with explicit expiry_seconds.
    fn create_funded_order_expiry(
        escrow_addr: ContractAddress,
        token_addr: ContractAddress,
        amount: u256,
        expiry: u64,
    ) -> u64 {
        token_at(token_addr).mint(buyer(), amount);

        start_cheat_caller_address(token_addr, buyer());
        token_at(token_addr).approve(escrow_addr, amount);
        stop_cheat_caller_address(token_addr);

        start_cheat_caller_address(escrow_addr, buyer());
        let id = escrow_at(escrow_addr)
            .create_order(buyer(), farmer(), token_addr, amount, expiry)
            .unwrap();
        stop_cheat_caller_address(escrow_addr);
        id
    }

    // ================================================================
    //  SECTION 1 — Pure fee logic
    // ================================================================

    #[test]
    fn test_fee_1000() {
        let (fee, net) = compute_fee(1000_u256);
        assert(fee == 30_u256, 'fee should be 30');
        assert(net == 970_u256, 'net should be 970');
    }

    #[test]
    fn test_fee_rounds_down() {
        let (fee, net) = compute_fee(101_u256);
        assert(fee == 3_u256, 'fee floors to 3');
        assert(net == 98_u256, 'net should be 98');
    }

    #[test]
    fn test_fee_zero() {
        let (fee, net) = compute_fee(0_u256);
        assert(fee == 0_u256, 'fee of 0 is 0');
        assert(net == 0_u256, 'net of 0 is 0');
    }

    #[test]
    fn test_fee_large() {
        let (fee, net) = compute_fee(1_000_000_u256);
        assert(fee == 30_000_u256, 'fee should be 30000');
        assert(net == 970_000_u256, 'net should be 970000');
    }

    #[test]
    fn test_fee_invariant() {
        let amounts: Array<u256> = array![
            1_u256, 33_u256, 999_u256, 10_000_u256, 99_999_u256,
        ];
        let mut i = 0;
        while i < amounts.len() {
            let a = *amounts.at(i);
            let (fee, net) = compute_fee(a);
            assert(fee + net == a, 'fee+net must equal amount');
            i += 1;
        }
    }

    // ================================================================
    //  SECTION 2 — Pure split logic
    // ================================================================

    #[test]
    fn test_split_50_50() {
        let (f, b) = compute_split(1000_u256, 5000);
        assert(f == 500_u256, 'farmer gets 500');
        assert(b == 500_u256, 'buyer gets 500');
    }

    #[test]
    fn test_split_60_40() {
        let (f, b) = compute_split(1000_u256, 6000);
        assert(f == 600_u256, 'farmer gets 600');
        assert(b == 400_u256, 'buyer gets 400');
    }

    #[test]
    fn test_split_all_to_farmer() {
        let (f, b) = compute_split(1000_u256, 10000);
        assert(f == 1000_u256, 'farmer gets all');
        assert(b == 0_u256, 'buyer gets nothing');
    }

    #[test]
    fn test_split_all_to_buyer() {
        let (f, b) = compute_split(1000_u256, 0);
        assert(f == 0_u256, 'farmer gets nothing');
        assert(b == 1000_u256, 'buyer gets all');
    }

    #[test]
    fn test_split_invariant() {
        let cases: Array<(u256, u16)> = array![
            (1000_u256, 3333_u16),
            (970_u256, 6000_u16),
            (500_u256, 1_u16),
            (99999_u256, 9999_u16),
        ];
        let mut i = 0;
        while i < cases.len() {
            let (net, bps) = *cases.at(i);
            let (f, b) = compute_split(net, bps);
            assert(f + b == net, 'split must sum to net');
            i += 1;
        }
    }

    // ================================================================
    //  SECTION 3 — initialize()
    // ================================================================

    #[test]
    fn test_initialize_stores_all_values() {
        let (escrow_addr, token_addr) = setup();
        assert(escrow_at(escrow_addr).get_fee_collector() == fee_collector(), 'wrong fee_collector');
        assert(escrow_at(escrow_addr).get_arbitrator() == arbitrator(), 'wrong arbitrator');
        assert(escrow_at(escrow_addr).get_order_count() == 0, 'count should be 0');
        let tokens = escrow_at(escrow_addr).get_supported_tokens();
        assert(tokens.len() == 2, 'should have 2 tokens');
        assert(*tokens.at(0) == token_addr, 'first token wrong');
        assert(*tokens.at(1) == token_b_addr(), 'second token wrong');
    }

    #[test]
    fn test_initialize_twice_fails() {
        let (escrow_addr, token_addr) = setup();
        let result = escrow_at(escrow_addr).initialize(
            admin(), arbitrator(),
            array![token_addr, token_b_addr()],
            fee_collector(),
        );
        assert(
            result == Result::Err(EscrowError::AlreadyInitialized),
            'double init must fail',
        );
    }

    #[test]
    fn test_initialize_one_token_fails() {
        let escrow_addr = deploy_escrow();
        let token_addr = deploy_mock_erc20();
        let result = escrow_at(escrow_addr).initialize(
            admin(), arbitrator(), array![token_addr], fee_collector(),
        );
        assert(
            result == Result::Err(EscrowError::MustSupportTwoTokens),
            'need 2+ tokens',
        );
    }

    #[test]
    fn test_initialize_no_tokens_fails() {
        let escrow_addr = deploy_escrow();
        let result = escrow_at(escrow_addr).initialize(
            admin(), arbitrator(), array![], fee_collector(),
        );
        assert(
            result == Result::Err(EscrowError::MustSupportTwoTokens),
            'empty tokens must fail',
        );
    }

    // ================================================================
    //  SECTION 4 — Empty index state
    // ================================================================

    #[test]
    fn test_buyer_index_empty() {
        let (escrow_addr, _) = setup();
        assert(escrow_at(escrow_addr).get_orders_by_buyer(buyer()).len() == 0, 'no orders');
    }

    #[test]
    fn test_farmer_index_empty() {
        let (escrow_addr, _) = setup();
        assert(escrow_at(escrow_addr).get_orders_by_farmer(farmer()).len() == 0, 'no orders');
    }

    #[test]
    fn test_order_details_nonexistent() {
        let (escrow_addr, _) = setup();
        let r = escrow_at(escrow_addr).get_order_details(99);
        assert(r.is_err(), 'should be error');
        assert(r.unwrap_err() == EscrowError::OrderDoesNotExist, 'wrong error');
    }

    #[test]
    fn test_order_zero_id_invalid() {
        let (escrow_addr, _) = setup();
        let r = escrow_at(escrow_addr).get_order_details(0);
        assert(r.is_err(), 'should be error');
        assert(r.unwrap_err() == EscrowError::OrderDoesNotExist, 'order 0 invalid');
    }

    // ================================================================
    //  SECTION 5 — create_order() guards
    // ================================================================

    #[test]
    #[should_panic(expected: ('Caller must be buyer',))]
    fn test_create_wrong_caller() {
        let (escrow_addr, token_addr) = setup();
        start_cheat_caller_address(escrow_addr, stranger());
        escrow_at(escrow_addr)
            .create_order(buyer(), farmer(), token_addr, 1000_u256, 0)
            .unwrap();
        stop_cheat_caller_address(escrow_addr);
    }

    #[test]
    fn test_create_unsupported_token() {
        let (escrow_addr, _) = setup();
        let bad: ContractAddress = 99.try_into().unwrap();
        start_cheat_caller_address(escrow_addr, buyer());
        let r = escrow_at(escrow_addr).create_order(buyer(), farmer(), bad, 1000_u256, 0);
        stop_cheat_caller_address(escrow_addr);
        assert(r == Result::Err(EscrowError::UnsupportedToken), 'unsupported token');
    }

    #[test]
    fn test_create_zero_amount() {
        let (escrow_addr, token_addr) = setup();
        start_cheat_caller_address(escrow_addr, buyer());
        let r = escrow_at(escrow_addr)
            .create_order(buyer(), farmer(), token_addr, 0_u256, 0);
        stop_cheat_caller_address(escrow_addr);
        assert(r == Result::Err(EscrowError::AmountMustBePositive), 'zero amount fails');
    }

    #[test]
    fn test_create_uninitialized() {
        let escrow_addr = deploy_escrow();
        let token_addr = deploy_mock_erc20();
        start_cheat_caller_address(escrow_addr, buyer());
        let r = escrow_at(escrow_addr)
            .create_order(buyer(), farmer(), token_addr, 1000_u256, 0);
        stop_cheat_caller_address(escrow_addr);
        assert(r == Result::Err(EscrowError::ContractNotInitialized), 'needs init');
    }

    #[test]
    fn test_create_expiry_below_min_fails() {
        let (escrow_addr, token_addr) = setup();
        token_at(token_addr).mint(buyer(), 1000_u256);

        start_cheat_caller_address(token_addr, buyer());
        token_at(token_addr).approve(escrow_addr, 1000_u256);
        stop_cheat_caller_address(token_addr);

        // 1 second — below 24h minimum
        start_cheat_caller_address(escrow_addr, buyer());
        let r = escrow_at(escrow_addr)
            .create_order(buyer(), farmer(), token_addr, 1000_u256, 1);
        stop_cheat_caller_address(escrow_addr);
        assert(r == Result::Err(EscrowError::InvalidExpiry), 'expiry too short');
    }

    #[test]
    fn test_create_expiry_above_max_fails() {
        let (escrow_addr, token_addr) = setup();
        token_at(token_addr).mint(buyer(), 1000_u256);

        start_cheat_caller_address(token_addr, buyer());
        token_at(token_addr).approve(escrow_addr, 1000_u256);
        stop_cheat_caller_address(token_addr);

        // 31 days — above 30-day maximum
        start_cheat_caller_address(escrow_addr, buyer());
        let r = escrow_at(escrow_addr)
            .create_order(buyer(), farmer(), token_addr, 1000_u256, 31 * 24 * 60 * 60);
        stop_cheat_caller_address(escrow_addr);
        assert(r == Result::Err(EscrowError::InvalidExpiry), 'expiry too long');
    }

    // ================================================================
    //  SECTION 6 — confirm_receipt() guards
    // ================================================================

    #[test]
    fn test_confirm_nonexistent() {
        let (escrow_addr, _) = setup();
        start_cheat_caller_address(escrow_addr, buyer());
        let r = escrow_at(escrow_addr).confirm_receipt(buyer(), 999);
        stop_cheat_caller_address(escrow_addr);
        assert(r == Result::Err(EscrowError::OrderDoesNotExist), 'order must exist');
    }

    // ================================================================
    //  SECTION 7 — refund_expired_order() guards
    // ================================================================

    #[test]
    fn test_refund_nonexistent() {
        let (escrow_addr, _) = setup();
        let r = escrow_at(escrow_addr).refund_expired_order(999);
        assert(r == Result::Err(EscrowError::OrderDoesNotExist), 'order must exist');
    }

    // ================================================================
    //  SECTION 8 — raise_dispute() guards
    // ================================================================

    #[test]
    fn test_dispute_nonexistent() {
        let (escrow_addr, _) = setup();
        start_cheat_caller_address(escrow_addr, buyer());
        let r = escrow_at(escrow_addr).raise_dispute(999);
        stop_cheat_caller_address(escrow_addr);
        assert(r == Result::Err(EscrowError::OrderDoesNotExist), 'order must exist');
    }

    #[test]
    fn test_dispute_stranger_fails() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_caller_address(escrow_addr, stranger());
        let r = escrow_at(escrow_addr).raise_dispute(id);
        stop_cheat_caller_address(escrow_addr);
        assert(r == Result::Err(EscrowError::NotParty), 'stranger cannot dispute');
    }

    #[test]
    fn test_dispute_buyer_can_raise() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_caller_address(escrow_addr, buyer());
        let r = escrow_at(escrow_addr).raise_dispute(id);
        stop_cheat_caller_address(escrow_addr);
        assert(r.is_ok(), 'buyer can dispute');
    }

    #[test]
    fn test_dispute_farmer_can_raise() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_caller_address(escrow_addr, farmer());
        let r = escrow_at(escrow_addr).raise_dispute(id);
        stop_cheat_caller_address(escrow_addr);
        assert(r.is_ok(), 'farmer can dispute');
    }

    #[test]
    fn test_dispute_twice_fails() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_caller_address(escrow_addr, buyer());
        escrow_at(escrow_addr).raise_dispute(id).unwrap();
        let r = escrow_at(escrow_addr).raise_dispute(id);
        stop_cheat_caller_address(escrow_addr);
        assert(r == Result::Err(EscrowError::OrderNotPending), 'cannot dispute twice');
    }

    #[test]
    fn test_dispute_after_expiry_fails() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_block_timestamp_global(97 * 60 * 60);
        start_cheat_caller_address(escrow_addr, buyer());
        let r = escrow_at(escrow_addr).raise_dispute(id);
        stop_cheat_caller_address(escrow_addr);
        stop_cheat_block_timestamp_global();
        assert(r == Result::Err(EscrowError::DisputeWindowClosed), 'window closed');
    }

    #[test]
    fn test_confirm_on_disputed_order_fails() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_caller_address(escrow_addr, buyer());
        escrow_at(escrow_addr).raise_dispute(id).unwrap();
        let r = escrow_at(escrow_addr).confirm_receipt(buyer(), id);
        stop_cheat_caller_address(escrow_addr);
        assert(r == Result::Err(EscrowError::OrderNotPending), 'no confirm on dispute');
    }

    #[test]
    fn test_refund_on_disputed_order_fails() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_caller_address(escrow_addr, buyer());
        escrow_at(escrow_addr).raise_dispute(id).unwrap();
        stop_cheat_caller_address(escrow_addr);
        start_cheat_block_timestamp_global(97 * 60 * 60);
        let r = escrow_at(escrow_addr).refund_expired_order(id);
        stop_cheat_block_timestamp_global();
        assert(r == Result::Err(EscrowError::OrderNotPending), 'no refund on dispute');
    }

    // ================================================================
    //  SECTION 9 — rule_dispute() guards
    // ================================================================

    #[test]
    fn test_rule_non_arbitrator_fails() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_caller_address(escrow_addr, buyer());
        escrow_at(escrow_addr).raise_dispute(id).unwrap();
        stop_cheat_caller_address(escrow_addr);
        start_cheat_caller_address(escrow_addr, stranger());
        let r = escrow_at(escrow_addr).rule_dispute(id, Resolution::ReleasedToFarmer, 0);
        stop_cheat_caller_address(escrow_addr);
        assert(r == Result::Err(EscrowError::NotArbitrator), 'only arbitrator rules');
    }

    #[test]
    fn test_rule_pending_order_fails() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_caller_address(escrow_addr, arbitrator());
        let r = escrow_at(escrow_addr).rule_dispute(id, Resolution::ReleasedToFarmer, 0);
        stop_cheat_caller_address(escrow_addr);
        assert(r == Result::Err(EscrowError::OrderNotDisputed), 'not disputed');
    }

    #[test]
    fn test_rule_invalid_bps_fails() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_caller_address(escrow_addr, buyer());
        escrow_at(escrow_addr).raise_dispute(id).unwrap();
        stop_cheat_caller_address(escrow_addr);
        start_cheat_caller_address(escrow_addr, arbitrator());
        let r = escrow_at(escrow_addr).rule_dispute(id, Resolution::Split, 10001);
        stop_cheat_caller_address(escrow_addr);
        assert(r == Result::Err(EscrowError::InvalidSplitBps), 'invalid bps');
    }

    #[test]
    fn test_rule_twice_fails() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_caller_address(escrow_addr, buyer());
        escrow_at(escrow_addr).raise_dispute(id).unwrap();
        stop_cheat_caller_address(escrow_addr);
        start_cheat_caller_address(escrow_addr, arbitrator());
        escrow_at(escrow_addr).rule_dispute(id, Resolution::ReleasedToFarmer, 0).unwrap();
        let r = escrow_at(escrow_addr).rule_dispute(id, Resolution::RefundedToBuyer, 0);
        stop_cheat_caller_address(escrow_addr);
        assert(r == Result::Err(EscrowError::OrderNotDisputed), 'cannot rule twice');
    }

    // ================================================================
    //  SECTION 10 — update_arbitrator() guards
    // ================================================================

    #[test]
    fn test_update_arbitrator_by_admin() {
        let (escrow_addr, _) = setup();
        start_cheat_caller_address(escrow_addr, admin());
        escrow_at(escrow_addr).update_arbitrator(new_arbitrator()).unwrap();
        stop_cheat_caller_address(escrow_addr);
        assert(escrow_at(escrow_addr).get_arbitrator() == new_arbitrator(), 'arb updated');
    }

    #[test]
    #[should_panic(expected: ('Caller must be admin',))]
    fn test_update_arbitrator_stranger_fails() {
        let (escrow_addr, _) = setup();
        start_cheat_caller_address(escrow_addr, stranger());
        escrow_at(escrow_addr).update_arbitrator(new_arbitrator()).unwrap();
        stop_cheat_caller_address(escrow_addr);
    }

    // ================================================================
    //  SECTION 11 — Full flow: create → confirm
    // ================================================================

    #[test]
    fn test_fee_collector_gets_3_pct() {
        let (escrow_addr, token_addr) = setup();
        create_funded_order(escrow_addr, token_addr, 1000_u256);
        assert(token_at(token_addr).balance_of(fee_collector()) == 30_u256, 'fee = 30');
    }

    #[test]
    fn test_escrow_holds_net() {
        let (escrow_addr, token_addr) = setup();
        create_funded_order(escrow_addr, token_addr, 1000_u256);
        assert(token_at(token_addr).balance_of(escrow_addr) == 970_u256, 'escrow = 970');
    }

    #[test]
    fn test_buyer_balance_zero_after_create() {
        let (escrow_addr, token_addr) = setup();
        create_funded_order(escrow_addr, token_addr, 1000_u256);
        assert(token_at(token_addr).balance_of(buyer()) == 0_u256, 'buyer = 0');
    }

    #[test]
    fn test_order_stores_net() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        let order = escrow_at(escrow_addr).get_order_details(id).unwrap();
        assert(order.amount == 970_u256, 'order.amount = 970');
    }

    #[test]
    fn test_order_count_increments() {
        let (escrow_addr, token_addr) = setup();
        create_funded_order(escrow_addr, token_addr, 1000_u256);
        assert(escrow_at(escrow_addr).get_order_count() == 1, 'count = 1');
        create_funded_order(escrow_addr, token_addr, 500_u256);
        assert(escrow_at(escrow_addr).get_order_count() == 2, 'count = 2');
    }

    #[test]
    fn test_buyer_index_updated() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        let orders = escrow_at(escrow_addr).get_orders_by_buyer(buyer());
        assert(orders.len() == 1, 'buyer has 1 order');
        assert(*orders.at(0) == id, 'id matches');
    }

    #[test]
    fn test_farmer_index_updated() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        let orders = escrow_at(escrow_addr).get_orders_by_farmer(farmer());
        assert(orders.len() == 1, 'farmer has 1 order');
        assert(*orders.at(0) == id, 'id matches');
    }

    #[test]
    fn test_confirm_releases_to_farmer() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_caller_address(escrow_addr, buyer());
        escrow_at(escrow_addr).confirm_receipt(buyer(), id).unwrap();
        stop_cheat_caller_address(escrow_addr);
        assert(token_at(token_addr).balance_of(farmer()) == 970_u256, 'farmer = 970');
        assert(token_at(token_addr).balance_of(escrow_addr) == 0_u256, 'escrow = 0');
    }

    #[test]
    fn test_confirm_wrong_buyer_fails() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_caller_address(escrow_addr, stranger());
        let r = escrow_at(escrow_addr).confirm_receipt(stranger(), id);
        stop_cheat_caller_address(escrow_addr);
        assert(r == Result::Err(EscrowError::NotBuyer), 'wrong buyer fails');
    }

    #[test]
    fn test_confirm_twice_fails() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_caller_address(escrow_addr, buyer());
        escrow_at(escrow_addr).confirm_receipt(buyer(), id).unwrap();
        let r = escrow_at(escrow_addr).confirm_receipt(buyer(), id);
        stop_cheat_caller_address(escrow_addr);
        assert(r == Result::Err(EscrowError::OrderNotPending), 'double confirm fails');
    }

    #[test]
    fn test_fee_unchanged_after_confirm() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_caller_address(escrow_addr, buyer());
        escrow_at(escrow_addr).confirm_receipt(buyer(), id).unwrap();
        stop_cheat_caller_address(escrow_addr);
        assert(token_at(token_addr).balance_of(fee_collector()) == 30_u256, 'fee stays 30');
    }

    // ================================================================
    //  SECTION 12 — Full flow: create → expire → refund
    // ================================================================

    #[test]
    fn test_refund_before_expiry_fails() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_block_timestamp_global(95 * 60 * 60);
        let r = escrow_at(escrow_addr).refund_expired_order(id);
        stop_cheat_block_timestamp_global();
        assert(r == Result::Err(EscrowError::OrderNotExpired), 'too early');
    }

    #[test]
    fn test_refund_after_expiry_succeeds() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_block_timestamp_global(97 * 60 * 60);
        escrow_at(escrow_addr).refund_expired_order(id).unwrap();
        stop_cheat_block_timestamp_global();
        assert(token_at(token_addr).balance_of(buyer()) == 970_u256, 'buyer = 970');
        assert(token_at(token_addr).balance_of(escrow_addr) == 0_u256, 'escrow = 0');
    }

    #[test]
    fn test_refund_confirmed_order_fails() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_caller_address(escrow_addr, buyer());
        escrow_at(escrow_addr).confirm_receipt(buyer(), id).unwrap();
        stop_cheat_caller_address(escrow_addr);
        start_cheat_block_timestamp_global(97 * 60 * 60);
        let r = escrow_at(escrow_addr).refund_expired_order(id);
        stop_cheat_block_timestamp_global();
        assert(r == Result::Err(EscrowError::OrderNotPending), 'confirmed not refundable');
    }

    #[test]
    fn test_fee_non_refundable() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_block_timestamp_global(97 * 60 * 60);
        escrow_at(escrow_addr).refund_expired_order(id).unwrap();
        stop_cheat_block_timestamp_global();
        assert(token_at(token_addr).balance_of(fee_collector()) == 30_u256, 'fee non-refundable');
    }

    #[test]
    fn test_batch_refund() {
        let (escrow_addr, token_addr) = setup();
        let id1 = create_funded_order(escrow_addr, token_addr, 1000_u256);
        let id2 = create_funded_order(escrow_addr, token_addr, 500_u256);
        start_cheat_block_timestamp_global(97 * 60 * 60);
        escrow_at(escrow_addr).refund_expired_orders(array![id1, id2]).unwrap();
        stop_cheat_block_timestamp_global();
        // 970 + 485 = 1455
        assert(token_at(token_addr).balance_of(buyer()) == 1455_u256, 'buyer gets both');
        assert(token_at(token_addr).balance_of(escrow_addr) == 0_u256, 'escrow = 0');
    }

    #[test]
    fn test_batch_refund_not_expired_fails() {
        let (escrow_addr, token_addr) = setup();
        let id1 = create_funded_order(escrow_addr, token_addr, 1000_u256);
        let id2 = create_funded_order(escrow_addr, token_addr, 500_u256);
        start_cheat_block_timestamp_global(95 * 60 * 60);
        let r = escrow_at(escrow_addr).refund_expired_orders(array![id1, id2]);
        stop_cheat_block_timestamp_global();
        assert(r == Result::Err(EscrowError::OrderNotExpired), 'batch all-or-nothing');
    }

    // ================================================================
    //  SECTION 13 — Full flow: dispute → farmer wins
    // ================================================================

    #[test]
    fn test_dispute_farmer_wins() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_caller_address(escrow_addr, buyer());
        escrow_at(escrow_addr).raise_dispute(id).unwrap();
        stop_cheat_caller_address(escrow_addr);
        start_cheat_caller_address(escrow_addr, arbitrator());
        escrow_at(escrow_addr).rule_dispute(id, Resolution::ReleasedToFarmer, 0).unwrap();
        stop_cheat_caller_address(escrow_addr);
        assert(token_at(token_addr).balance_of(farmer()) == 970_u256, 'farmer = 970');
        assert(token_at(token_addr).balance_of(buyer()) == 0_u256, 'buyer = 0');
        assert(token_at(token_addr).balance_of(escrow_addr) == 0_u256, 'escrow = 0');
    }

    // ================================================================
    //  SECTION 14 — Full flow: dispute → buyer wins
    // ================================================================

    #[test]
    fn test_dispute_buyer_wins() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_caller_address(escrow_addr, farmer());
        escrow_at(escrow_addr).raise_dispute(id).unwrap();
        stop_cheat_caller_address(escrow_addr);
        start_cheat_caller_address(escrow_addr, arbitrator());
        escrow_at(escrow_addr).rule_dispute(id, Resolution::RefundedToBuyer, 0).unwrap();
        stop_cheat_caller_address(escrow_addr);
        assert(token_at(token_addr).balance_of(buyer()) == 970_u256, 'buyer = 970');
        assert(token_at(token_addr).balance_of(farmer()) == 0_u256, 'farmer = 0');
        assert(token_at(token_addr).balance_of(escrow_addr) == 0_u256, 'escrow = 0');
    }

    // ================================================================
    //  SECTION 15 — Full flow: dispute → split ruling
    // ================================================================

    #[test]
    fn test_dispute_split_60_40() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_caller_address(escrow_addr, buyer());
        escrow_at(escrow_addr).raise_dispute(id).unwrap();
        stop_cheat_caller_address(escrow_addr);
        start_cheat_caller_address(escrow_addr, arbitrator());
        escrow_at(escrow_addr).rule_dispute(id, Resolution::Split, 6000).unwrap();
        stop_cheat_caller_address(escrow_addr);
        let (ef, eb) = compute_split(970_u256, 6000);
        assert(token_at(token_addr).balance_of(farmer()) == ef, 'farmer split wrong');
        assert(token_at(token_addr).balance_of(buyer()) == eb, 'buyer split wrong');
        assert(token_at(token_addr).balance_of(escrow_addr) == 0_u256, 'escrow = 0');
    }

    #[test]
    fn test_dispute_split_sums_to_net() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_caller_address(escrow_addr, buyer());
        escrow_at(escrow_addr).raise_dispute(id).unwrap();
        stop_cheat_caller_address(escrow_addr);
        start_cheat_caller_address(escrow_addr, arbitrator());
        escrow_at(escrow_addr).rule_dispute(id, Resolution::Split, 3333).unwrap();
        stop_cheat_caller_address(escrow_addr);
        let total = token_at(token_addr).balance_of(farmer())
            + token_at(token_addr).balance_of(buyer());
        assert(total == 970_u256, 'split sums to net');
    }

    #[test]
    fn test_fee_unchanged_after_dispute_ruling() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        start_cheat_caller_address(escrow_addr, buyer());
        escrow_at(escrow_addr).raise_dispute(id).unwrap();
        stop_cheat_caller_address(escrow_addr);
        start_cheat_caller_address(escrow_addr, arbitrator());
        escrow_at(escrow_addr).rule_dispute(id, Resolution::RefundedToBuyer, 0).unwrap();
        stop_cheat_caller_address(escrow_addr);
        assert(token_at(token_addr).balance_of(fee_collector()) == 30_u256, 'fee stays 30');
    }

    // ================================================================
    //  SECTION 16 — Custom expiry
    // ================================================================

    #[test]
    fn test_custom_expiry_48h_not_expired_at_47h() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order_expiry(escrow_addr, token_addr, 1000_u256, 48 * 60 * 60);
        start_cheat_block_timestamp_global(47 * 60 * 60);
        let r = escrow_at(escrow_addr).refund_expired_order(id);
        stop_cheat_block_timestamp_global();
        assert(r == Result::Err(EscrowError::OrderNotExpired), 'not expired at 47h');
    }

    #[test]
    fn test_custom_expiry_48h_expired_at_49h() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order_expiry(escrow_addr, token_addr, 1000_u256, 48 * 60 * 60);
        start_cheat_block_timestamp_global(49 * 60 * 60);
        let r = escrow_at(escrow_addr).refund_expired_order(id);
        stop_cheat_block_timestamp_global();
        assert(r.is_ok(), 'expired at 49h');
    }

    #[test]
    fn test_default_expiry_is_96h() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);
        let order = escrow_at(escrow_addr).get_order_details(id).unwrap();
        assert(order.expiry_seconds == 96 * 60 * 60, 'default expiry = 96h');
    }

    // ================================================================
    //  SECTION 17 — Arbitrator rotation
    // ================================================================

    #[test]
    fn test_old_arbitrator_cannot_rule_after_rotation() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);

        start_cheat_caller_address(escrow_addr, admin());
        escrow_at(escrow_addr).update_arbitrator(new_arbitrator()).unwrap();
        stop_cheat_caller_address(escrow_addr);

        start_cheat_caller_address(escrow_addr, buyer());
        escrow_at(escrow_addr).raise_dispute(id).unwrap();
        stop_cheat_caller_address(escrow_addr);

        start_cheat_caller_address(escrow_addr, arbitrator());
        let r = escrow_at(escrow_addr).rule_dispute(id, Resolution::ReleasedToFarmer, 0);
        stop_cheat_caller_address(escrow_addr);
        assert(r == Result::Err(EscrowError::NotArbitrator), 'old arb blocked');
    }

    #[test]
    fn test_new_arbitrator_can_rule_after_rotation() {
        let (escrow_addr, token_addr) = setup();
        let id = create_funded_order(escrow_addr, token_addr, 1000_u256);

        start_cheat_caller_address(escrow_addr, admin());
        escrow_at(escrow_addr).update_arbitrator(new_arbitrator()).unwrap();
        stop_cheat_caller_address(escrow_addr);

        start_cheat_caller_address(escrow_addr, buyer());
        escrow_at(escrow_addr).raise_dispute(id).unwrap();
        stop_cheat_caller_address(escrow_addr);

        start_cheat_caller_address(escrow_addr, new_arbitrator());
        let r = escrow_at(escrow_addr).rule_dispute(id, Resolution::ReleasedToFarmer, 0);
        stop_cheat_caller_address(escrow_addr);
        assert(r.is_ok(), 'new arb can rule');
    }
}
