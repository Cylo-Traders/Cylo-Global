"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import AccountModal from "@/components/modals/account-modal";
import WalletModal from "@/components/modals/wallet-modal";
import { useAuthStore } from "@/lib/store/auth";

export function ConnectWalletInner() {
  const { authenticated, ready } = usePrivy();
  const { isOnboarded } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!ready || !authenticated) return;

    // Redirect only when the user just logged in — detected by either:
    // 1. OAuth callback: Privy puts `privy_oauth_state` in the URL
    // 2. Email login: we set a sessionStorage flag before calling login()
    const url = new URL(window.location.href);
    const isOAuthCallback = url.searchParams.has("privy_oauth_state");
    const wasLoginInitiated = sessionStorage.getItem("privy_login_initiated");

    if (isOAuthCallback || wasLoginInitiated) {
      sessionStorage.removeItem("privy_login_initiated");
      router.push(isOnboarded ? "/dashboard" : "/onboarding");
    }
  }, [ready, authenticated, isOnboarded, router]);

  // Show account dropdown as soon as Privy says the user is authenticated.
  // Wallet address may take a moment to populate (requires backend), so we
  // don't gate on address — the modal gracefully handles the connecting state.
  if (authenticated) {
    return <AccountModal />;
  }

  return <WalletModal />;
}
