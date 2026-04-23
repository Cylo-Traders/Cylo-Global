"use client";

import { PrivyProvider as BasePrivyProvider } from "@privy-io/react-auth";
import type { ReactNode } from "react";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;

export function PrivyProvider({ children }: { children: ReactNode }) {
  return (
    <BasePrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#16a34a",
          logo: "/favicon.svg",
        },
        loginMethods: ["email", "google"],
        // Wallets are app-managed (created server-side without owner.user_id).
        // We do not use Privy's embedded wallets — Starkzap handles the Starknet
        // wallet after /api/auth/signer-context returns walletId + publicKey.
      }}
    >
      {children}
    </BasePrivyProvider>
  );
}
