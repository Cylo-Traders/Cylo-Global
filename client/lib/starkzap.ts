import { StarkZap } from "starkzap";

const network = (process.env.NEXT_PUBLIC_STARKNET_NETWORK || "sepolia") as
  | "sepolia"
  | "mainnet";

// Point paymaster at backend proxy — API key is never exposed client-side.
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Leave rpcUrl undefined to use Starkzap's built-in Cartridge.gg endpoint.
// Custom free RPCs (Alchemy, Blast) cause -32001 errors under load.
const rpcUrl = process.env.NEXT_PUBLIC_STARKNET_RPC_URL || undefined;

export const sdk = new StarkZap({
  network,
  rpcUrl,
  paymaster: { nodeUrl: `${apiUrl}/api/paymaster` },
});
