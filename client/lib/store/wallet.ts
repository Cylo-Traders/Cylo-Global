import { create } from "zustand";

// Wallet object from Starkzap — typed loosely so it doesn't import starkzap at module level
// (starkzap is browser-only and must not be evaluated server-side)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StarkWallet = any;

interface WalletStore {
  wallet: StarkWallet | null;
  address: string | null;
  isConnecting: boolean;
  usdcBalance: string | null;
  strkBalance: string | null;

  setWallet: (wallet: StarkWallet) => void;
  setAddress: (address: string) => void;
  setConnecting: (connecting: boolean) => void;
  setBalance: (usdc: string | null) => void;
  setStrkBalance: (strk: string | null) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletStore>()((set) => ({
  wallet: null,
  address: null,
  isConnecting: false,
  usdcBalance: null,
  strkBalance: null,

  setWallet: (wallet) =>
    set({
      wallet,
      address: typeof wallet?.getAddress === "function" ? wallet.getAddress() : null,
    }),

  setAddress: (address) => set({ address }),

  setConnecting: (isConnecting) => set({ isConnecting }),

  setBalance: (usdcBalance) => set({ usdcBalance }),

  setStrkBalance: (strkBalance) => set({ strkBalance }),

  reset: () =>
    set({
      wallet: null,
      address: null,
      isConnecting: false,
      usdcBalance: null,
      strkBalance: null,
    }),
}));
