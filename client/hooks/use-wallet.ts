"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { OnboardStrategy, AvnuSwapProvider } from "starkzap";
import { sdk } from "@/lib/starkzap";
import { useWalletStore } from "@/lib/store/wallet";
import { useAuthStore } from "@/lib/store/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function useWallet() {
  const { authenticated, getAccessToken, login, logout: privyLogout } = usePrivy();
  const { wallet, setWallet, setConnecting, reset } = useWalletStore();
  const { clearAuth } = useAuthStore();

  const connectingRef = useRef(false);
  const attemptedRef = useRef(false);

  const connectWallet = useCallback(async () => {
    if (!authenticated || wallet || connectingRef.current) return;
    connectingRef.current = true;
    setConnecting(true);

    try {
      const accessToken = await getAccessToken();

      const { wallet: starkWallet } = await sdk.onboard({
        strategy: OnboardStrategy.Privy,
        privy: {
          resolve: async () => {
            // Get or create the app-managed Starknet wallet from backend
            const res = await fetch(`${API_URL}/api/auth/signer-context`, {
              method: "POST",
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!res.ok) throw new Error("Failed to get signer context");
            const { walletId, publicKey } = await res.json();

            return {
              walletId,
              publicKey,
              rawSign: async (wId: string, hash: string) => {
                // Always call getAccessToken() fresh — captured tokens go stale
                // and cause "Sign relay error: 400"
                const freshToken = await getAccessToken();
                const signRes = await fetch(`${API_URL}/api/auth/sign`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${freshToken}`,
                  },
                  body: JSON.stringify({ walletId: wId, hash }),
                });
                if (!signRes.ok) throw new Error("Signing failed");
                const { signature } = await signRes.json();
                return signature;
              },
            };
          },
        },
        // OpenZeppelin preset — ArgentX compiled before Starknet 0.13.5 l1_data_gas
        // field; causes "__validate__ panicked: Out of gas" on every tx.
        accountPreset: "openzeppelin",
        feeMode: "sponsored",
        // Never auto-deploy — empty wallets have no gas for DEPLOY_ACCOUNT.
        // Call deployIfNeeded() before every transaction instead.
        deploy: "never",
      });

      // Patch resolveDetailsWithTip — fixes starknet.js v9 BigInt/Number coercion bug.
      // Use BigInt(0) not 0n — BigInt literals require tsconfig target ES2020+.
      const account = starkWallet.getAccount() as unknown as Record<string, unknown>;
      if (account && typeof account.resolveDetailsWithTip === "function") {
        const orig = (
          account.resolveDetailsWithTip as (
            ...a: unknown[]
          ) => Promise<Record<string, unknown>>
        ).bind(account);

        account.resolveDetailsWithTip = async (details: Record<string, unknown>) => {
          const resolved = await orig(details);
          const rb = resolved.resourceBounds as
            | Record<string, Record<string, unknown>>
            | undefined;
          if (
            rb?.l1_gas &&
            (rb.l1_gas.max_amount === "0x0" ||
              rb.l1_gas.max_amount === BigInt(0) ||
              rb.l1_gas.max_amount === 0)
          ) {
            rb.l1_gas = { ...rb.l1_gas, max_amount: "0x1000" };
          }
          return { ...resolved, tip: BigInt(0), resourceBounds: rb ?? resolved.resourceBounds };
        };
      }

      // Register AVNU as the default swap provider
      starkWallet.registerSwapProvider(new AvnuSwapProvider(), true);

      setWallet(starkWallet);
    } finally {
      setConnecting(false);
      connectingRef.current = false;
    }
  }, [authenticated, wallet, getAccessToken, setWallet, setConnecting]);

  // Auto-connect when user authenticates
  useEffect(() => {
    if (!authenticated || wallet || attemptedRef.current) return;
    attemptedRef.current = true;
    connectWallet();
  }, [authenticated, wallet, connectWallet]);

  // Reset attempt flag on logout
  useEffect(() => {
    if (!authenticated) {
      attemptedRef.current = false;
    }
  }, [authenticated]);

  /** Call before every transaction — idempotent, gas is sponsored by AVNU */
  const deployIfNeeded = useCallback(async () => {
    if (!wallet) throw new Error("Wallet not connected");
    await wallet.ensureReady({ deploy: "if_needed", feeMode: "sponsored" });
  }, [wallet]);

  const logout = useCallback(async () => {
    connectingRef.current = false;
    attemptedRef.current = false;
    reset();      // clear wallet store (in-memory)
    clearAuth();  // clear auth store (localStorage) — prevents stale isOnboarded on next login
    await privyLogout();
  }, [reset, clearAuth, privyLogout]);

  return {
    wallet,
    login,
    logout,
    deployIfNeeded,
    isAuthenticated: authenticated,
  };
}
