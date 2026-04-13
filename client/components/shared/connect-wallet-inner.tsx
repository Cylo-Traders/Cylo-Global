"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "@starknet-react/core";
import WalletModal from "@/components/modals/wallet-modal";
import AccountModal from "@/components/modals/account-modal";

export function ConnectWalletInner() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const prevConnected = useRef<boolean>(false);

  useEffect(() => {
    if (isConnected && !prevConnected.current) {
      router.push("/dashboard");
    }
    prevConnected.current = isConnected ?? false;
  }, [isConnected, router]);

  if (isConnected && address) {
    return <AccountModal />;
  }

  return <WalletModal />;
}
