This folder contains the Cylo project smart contracts.

To Declare
sncast --account <my_account> \
  declare \
  --network sepolia \
  --contract-name EscrowContract

To Deploy
  sncast --account <my_account> \
  deploy \
  --network sepolia \
  --class-hash <declared_class_hash>

Declared 
  class-hash: class-hash 0x05bca087daf089f4d7cc754e546ddb7a392a909e670bfba429152ad889c6727b

Deployed
  Contract Address: 0x04c8b3794bb261976fa264b694ab6c2f09ddedfdb9aacfc96a179f7e345f5e40
  Transaction Hash: 0x07242e5535b2a03137cbee79a0628f7828b493ddaa4fa9d41099d5d1fe95cc57