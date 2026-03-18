// ============================================================
//  tests.cairo — unit + integration tests
//
//  Pure logic tests: no deployment, just function calls.
//  Integration tests: deploy contract via snforge, call via dispatcher.
// ============================================================
//0x01ebdc181531defe6b306f8c8f3a65b24f0c4572c317279c48ed112e310fd628
mod tests {
    // use starknet::contract_address_const;

    use cylos::escrow::compute_fee;
    use cylos::interface::{IEscrowDispatcher, IEscrowDispatcherTrait};
    use cylos::types::EscrowError;
    use snforge_std::{
        ContractClassTrait, DeclareResultTrait, declare, start_cheat_caller_address,
        stop_cheat_caller_address,
        // start_cheat_block_timestamp_global, stop_cheat_block_timestamp_global,
    };
    use starknet::{ContractAddress, SyscallResultTrait};

    // ── Helpers
    // ───────────────────────────────────────────────

    //fn admin() -> ContractAddress { contract_address_const::<'admin'>() }
    fn admin() -> ContractAddress {
        1.try_into().unwrap()
    }
    fn fee_collector() -> ContractAddress {
        2.try_into().unwrap()
    }
    fn buyer() -> ContractAddress {
        3.try_into().unwrap()
    }
    fn farmer() -> ContractAddress {
        4.try_into().unwrap()
    }
    fn token_a() -> ContractAddress {
        5.try_into().unwrap()
    }
    fn token_b() -> ContractAddress {
        6.try_into().unwrap()
    }
    fn stranger() -> ContractAddress {
        7.try_into().unwrap()
    }

    /// Deploy the escrow contract and return a dispatcher
    fn deploy_escrow() -> IEscrowDispatcher {
        let contract = declare("EscrowContract").unwrap_syscall().contract_class();
        let (address, _) = contract.deploy(@array![]).unwrap_syscall();
        IEscrowDispatcher { contract_address: address }
    }

    /// Deploy and immediately initialize with two tokens
    fn deploy_and_init() -> IEscrowDispatcher {
        let escrow = deploy_escrow();
        escrow.initialize(admin(), array![token_a(), token_b()], fee_collector()).unwrap();
        escrow
    }

    // ================================================================
    //  SECTION 1 — Pure fee logic (no deployment)
    // ================================================================

    #[test]
    fn test_fee_1000() {
        let (fee, net) = compute_fee(1000_u256);
        assert(fee == 30_u256, 'fee should be 30');
        assert(net == 970_u256, 'net should be 970');
    }

    #[test]
    fn test_fee_rounds_down() {
        // 3% of 101 = 3.03 → floors to 3
        let (fee, net) = compute_fee(101_u256);
        assert(fee == 3_u256, 'fee floors to 3');
        assert(net == 98_u256, 'net should be 98');
    }

    #[test]
    fn test_fee_zero_amount() {
        let (fee, net) = compute_fee(0_u256);
        assert(fee == 0_u256, 'fee of 0 is 0');
        assert(net == 0_u256, 'net of 0 is 0');
    }

    #[test]
    fn test_fee_large_amount() {
        // 1_000_000 units (e.g. USDC with 6 decimals = $1)
        let (fee, net) = compute_fee(1_000_000_u256);
        assert(fee == 30_000_u256, 'fee should be 30000');
        assert(net == 970_000_u256, 'net should be 970000');
    }

    #[test]
    fn test_fee_plus_net_equals_amount() {
        // Invariant: fee + net always == original amount
        let amounts: Array<u256> = array![1_u256, 33_u256, 999_u256, 10_000_u256, 99_999_u256];
        let mut i = 0;
        while i < amounts.len() {
            let amount = *amounts.at(i);
            let (fee, net) = compute_fee(amount);
            assert(fee + net == amount, 'fee+net must equal amount');
            i += 1;
        };
    }

    // ================================================================
    //  SECTION 2 — initialize()
    // ================================================================

    #[test]
    fn test_initialize_succeeds() {
        let escrow = deploy_escrow();
        let result = escrow.initialize(admin(), array![token_a(), token_b()], fee_collector());
        assert(result.is_ok(), 'init should succeed');
    }

    #[test]
    fn test_initialize_stores_fee_collector() {
        let escrow = deploy_and_init();
        assert(escrow.get_fee_collector() == fee_collector(), 'wrong fee collector');
    }

    #[test]
    fn test_initialize_stores_supported_tokens() {
        let escrow = deploy_and_init();
        let tokens = escrow.get_supported_tokens();
        assert(tokens.len() == 2, 'should have 2 tokens');
        assert(*tokens.at(0) == token_a(), 'first token mismatch');
        assert(*tokens.at(1) == token_b(), 'second token mismatch');
    }

    #[test]
    fn test_initialize_order_count_starts_at_zero() {
        let escrow = deploy_and_init();
        assert(escrow.get_order_count() == 0, 'order count should start at 0');
    }

    #[test]
    fn test_initialize_twice_fails() {
        let escrow = deploy_and_init();
        let result = escrow.initialize(admin(), array![token_a(), token_b()], fee_collector());
        assert(result == Result::Err(EscrowError::AlreadyInitialized), 'double init must fail');
    }

    #[test]
    fn test_initialize_requires_two_tokens() {
        let escrow = deploy_escrow();
        let result = escrow.initialize(admin(), array![token_a()], fee_collector());
        assert(result == Result::Err(EscrowError::MustSupportTwoTokens), 'need 2+ tokens');
    }

    #[test]
    fn test_initialize_empty_tokens_fails() {
        let escrow = deploy_escrow();
        let result = escrow.initialize(admin(), array![], fee_collector());
        assert(result == Result::Err(EscrowError::MustSupportTwoTokens), 'empty tokens must fail');
    }

    // ================================================================
    //  SECTION 3 — get_order_details() on nonexistent order
    // ================================================================

    #[test]
    fn test_get_order_details_nonexistent() {
        let escrow = deploy_and_init();
        let result = escrow.get_order_details(99);
        assert(result.is_err(), 'should be an error');
        assert(result.unwrap_err() == EscrowError::OrderDoesNotExist, 'order 99 should not exist');
    }

    #[test]
    fn test_get_order_details_zero_id_fails() {
        let escrow = deploy_and_init();
        let result = escrow.get_order_details(0);
        assert(result.is_err(), 'should be an error');
        assert(result.unwrap_err() == EscrowError::OrderDoesNotExist, 'order 0 is invalid');
    }

    // ================================================================
    //  SECTION 4 — get_orders_by_buyer / get_orders_by_farmer
    //  (empty state — no ERC20 needed)
    // ================================================================

    #[test]
    fn test_buyer_orders_empty_initially() {
        let escrow = deploy_and_init();
        let orders = escrow.get_orders_by_buyer(buyer());
        assert(orders.len() == 0, 'buyer should have no orders');
    }

    #[test]
    fn test_farmer_orders_empty_initially() {
        let escrow = deploy_and_init();
        let orders = escrow.get_orders_by_farmer(farmer());
        assert(orders.len() == 0, 'farmer should have no orders');
    }

    // ================================================================
    //  SECTION 5 — create_order() guard checks
    //  These revert before any ERC20 transfer, so no mock needed.
    // ================================================================

    #[test]
    #[should_panic(expected: ('Caller must be buyer',))]
    fn test_create_order_caller_must_be_buyer() {
        let escrow = deploy_and_init();
        // stranger calls create_order but passes buyer() as the buyer arg
        start_cheat_caller_address(escrow.contract_address, stranger());
        escrow.create_order(buyer(), farmer(), token_a(), 1000_u256).unwrap();
        stop_cheat_caller_address(escrow.contract_address);
    }

    #[test]
    fn test_create_order_unsupported_token_fails() {
        let escrow = deploy_and_init();
        let unknown_token: ContractAddress = 99.try_into().unwrap();

        start_cheat_caller_address(escrow.contract_address, buyer());
        let result = escrow.create_order(buyer(), farmer(), unknown_token, 1000_u256);
        stop_cheat_caller_address(escrow.contract_address);

        assert(result == Result::Err(EscrowError::UnsupportedToken), 'unsupported token must fail');
    }

    #[test]
    fn test_create_order_zero_amount_fails() {
        let escrow = deploy_and_init();

        start_cheat_caller_address(escrow.contract_address, buyer());
        let result = escrow.create_order(buyer(), farmer(), token_a(), 0_u256);
        stop_cheat_caller_address(escrow.contract_address);

        assert(result == Result::Err(EscrowError::AmountMustBePositive), 'zero amount must fail');
    }

    #[test]
    fn test_create_order_uninitialized_contract_fails() {
        let escrow = deploy_escrow(); // NOT initialized

        start_cheat_caller_address(escrow.contract_address, buyer());
        let result = escrow.create_order(buyer(), farmer(), token_a(), 1000_u256);
        stop_cheat_caller_address(escrow.contract_address);

        assert(result == Result::Err(EscrowError::ContractNotInitialized), 'must be initialized');
    }

    // ================================================================
    //  SECTION 6 — confirm_receipt() guard checks
    // ================================================================

    #[test]
    fn test_confirm_receipt_nonexistent_order_fails() {
        let escrow = deploy_and_init();

        start_cheat_caller_address(escrow.contract_address, buyer());
        let result = escrow.confirm_receipt(buyer(), 999);
        stop_cheat_caller_address(escrow.contract_address);

        assert(result == Result::Err(EscrowError::OrderDoesNotExist), 'order must exist');
    }

    // ================================================================
    //  SECTION 7 — refund_expired_order() guard checks
    // ================================================================

    #[test]
    fn test_refund_nonexistent_order_fails() {
        let escrow = deploy_and_init();
        let result = escrow.refund_expired_order(999);
        assert(result == Result::Err(EscrowError::OrderDoesNotExist), 'order must exist');
    }
    // ================================================================
//  SECTION 8 — Full flow tests
//  Requires a mock ERC20. Uncomment once mock is deployed alongside.
//
//  Pattern:
//    1. Deploy mock ERC20, mint `amount` to buyer
//    2. Buyer approves escrow for `amount`
//    3. create_order → assert fee_collector got 3%, order stores 97%
//    4a. confirm_receipt → assert farmer got 97%
//    4b. OR advance time 96h → refund_expired_order → buyer got 97% back
// ================================================================

    // #[test]
// fn test_create_order_splits_fee_correctly() { ... }

    // #[test]
// fn test_confirm_receipt_releases_net_to_farmer() { ... }

    // #[test]
// fn test_refund_after_96h_returns_net_to_buyer() { ... }

    // #[test]
// fn test_refund_before_96h_fails() { ... }
}
