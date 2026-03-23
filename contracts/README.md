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

  `class-hash: class-hash 0x05bca087daf089f4d7cc754e546ddb7a392a909e670bfba429152ad889c6727b`

#### Deployed

`Contract Address: 0x04c8b3794bb261976fa264b694ab6c2f09ddedfdb9aacfc96a179f7e345f5e40`

`Transaction Hash: 0x07242e5535b2a03137cbee79a0628f7828b493ddaa4fa9d41099d5d1fe95cc57`