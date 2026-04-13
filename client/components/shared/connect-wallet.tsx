"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { IoWalletOutline } from "react-icons/io5";

const ConnectWalletInner = dynamic(
  () =>
    import("./connect-wallet-inner").then((m) => m.ConnectWalletInner),
  {
    ssr: false,
    loading: () => (
      <div>
        <Button className="hidden sm:inline-flex" disabled>
          Connect Wallet
        </Button>
        <Button size="icon" className="inline-flex sm:hidden" disabled>
          <IoWalletOutline className="!size-5" />
        </Button>
      </div>
    ),
  },
);

const ConnectWallet = () => <ConnectWalletInner />;

export default ConnectWallet;
