# Cylo Escrow smart contracts.

A trustless escrow smart contract deployed on Starknet, written in Cairo. It secures payments between buyers and farmers in the agro-marketplace — funds are locked on-chain and only released when the buyer confirms receipt of goods, or automatically refunded after 96 hours if no confirmation is made.

### Overview

* Language - Cairo
* Network - Starknet (Sepolia for now, Mainet migration later)
* Token - ERC-20 (STRK and USDC)
* Platform fee - 3% deducted at order creation
* Order Expiry - 96 hours

### To Declare

Run: `sncast --account <my_account> \
  declare \
  --network sepolia \
  --contract-name EscrowContract`

### To Deploy

Run: `sncast --account <my_account> \
  deploy \
  --network sepolia \
  --class-hash <declared_class_hash>`

#### Declared

  `class-hash: class-hash 0x02b77230ad2b511f10f6f1a46da59e19e17ea86dd23fa0dcef5c3258434b57f1`

#### Deployed

`Contract Address: 0x035061664df9ab8e55a6701b8a47eb87a3d040dbdf766a12897dae82e7f9f7ad`
