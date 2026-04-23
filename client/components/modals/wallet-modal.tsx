"use client";

import type { FC } from "react";
import { PropsWithChildren } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { IoWalletOutline } from "react-icons/io5";
import { Button } from "@/components/ui/button";

const WalletModal: FC<PropsWithChildren> = ({ children }) => {
  const { login, ready } = usePrivy();

  const handleLogin = () => {
    // Mark that login was initiated so ConnectWalletInner knows to redirect
    // after the OAuth callback returns to the page.
    sessionStorage.setItem("privy_login_initiated", "1");
    login();
  };

  if (children) {
    return (
      <div role="button" onClick={handleLogin} className="cursor-pointer">
        {children}
      </div>
    );
  }

  return (
    <div>
      <Button
        className="hidden sm:inline-flex"
        onClick={handleLogin}
        disabled={!ready}
      >
        Sign In
      </Button>
      <Button
        size="icon"
        className="inline-flex sm:hidden"
        onClick={handleLogin}
        disabled={!ready}
      >
        <IoWalletOutline className="!size-5" />
      </Button>
    </div>
  );
};

export default WalletModal;
