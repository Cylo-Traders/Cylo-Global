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

  `class-hash: 0x437e0e74b0bcf4dd604d7ba8f4b72e09adb90f9f62a630f43bbe3a0b55d7940`

#### Deployed

`Contract Address: 0x073adf6bf463c6d013952d2c4d3e56c8a2661c1504f3e33054a2e754baa401e3`
