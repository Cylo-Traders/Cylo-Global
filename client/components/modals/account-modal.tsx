"use client";

import Link from "next/link";
import type { FC } from "react";
import Blockies from "react-blockies";
import { PropsWithChildren, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { HiMiniArrowUpRight } from "react-icons/hi2";
import { IoIosPower } from "react-icons/io";
import { ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import CopyButton from "@/components/shared/copy-button";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { formatTruncatedAddress } from "@/lib/helpers/format-address";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/use-wallet";
import { useWalletStore } from "@/lib/store/wallet";
import { useAuthStore } from "@/lib/store/auth";

const AccountModal: FC<PropsWithChildren> = ({ children }) => {
  const isMobile = useIsMobile();
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const { user } = usePrivy();
  const { logout } = useWallet();
  const { address, usdcBalance, strkBalance } = useWalletStore();
  const { profile } = useAuthStore();

  const rawName =
    profile?.displayName ??
    user?.google?.name ??
    user?.email?.address?.split("@")[0] ??
    "Anonymous";

  // Show only the first word — display names can be "John Doe", Google names
  // can be full names, and we only have space for one word in the navbar.
  const displayName = rawName.split(" ")[0];

  const handleDisconnect = async () => {
    try {
      setShowModal(false);
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error(error instanceof Error ? error.message : "Logout failed");
    }
  };

  const explorerUrl = address
    ? `https://sepolia.voyager.online/contract/${address}`
    : "#";

  const balanceDisplay = usdcBalance
    ? `${Number(usdcBalance).toFixed(2)} USDC`
    : strkBalance
      ? `${Number(strkBalance).toFixed(4)} STRK`
      : "—";

  return (
    <DropdownMenu open={showModal} onOpenChange={setShowModal}>
      <DropdownMenuTrigger asChild>
        {children ?? (
          <div role="button" className="flex cursor-pointer items-center gap-2">
            <div className="grid size-10 place-content-center rounded-full border">
              <div className="bg-secondary size-8 rounded-full overflow-hidden">
                <Blockies
                  seed={address || user?.id || ""}
                  className="!size-full rounded-full object-cover"
                />
              </div>
            </div>

            <div className="hidden flex-col sm:flex">
              <span className="text-sm font-medium">{displayName}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {address ? formatTruncatedAddress(address) : "Connecting…"}
              </span>
            </div>

            <ChevronDown
              className={cn("size-4 transition duration-75 sm:ml-2", {
                "-rotate-180": showModal,
              })}
            />
          </div>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={isMobile ? "center" : "end"}
        className="mt-2 mr-6 sm:mr-0 md:w-[320px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="grid size-12 place-content-center rounded-full border">
              <div className="bg-secondary size-10 rounded-full overflow-hidden">
                <Blockies
                  seed={address || user?.id || ""}
                  className="!size-full rounded-full object-cover"
                />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{displayName}</span>
              <span className="text-xs text-muted-foreground">
                {address ? formatTruncatedAddress(address) : "Connecting…"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {address && (
              <>
                <CopyButton
                  className={buttonVariants({
                    className: "!rounded-sm",
                    size: "icon",
                    variant: "secondary",
                  })}
                  iconClassName="!size-4"
                  text={address}
                />
                <Link href={explorerUrl} target="_blank">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="!rounded-sm"
                    title="View on Voyager"
                  >
                    <HiMiniArrowUpRight className="!size-5" />
                    <span className="sr-only">View on Voyager</span>
                  </Button>
                </Link>
              </>
            )}
            <Button
              size="icon"
              variant="secondary"
              onClick={handleDisconnect}
              title="Logout"
              className="!bg-destructive/5 !text-destructive !rounded-sm"
            >
              <IoIosPower className="!size-5" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Balance */}
        <div className="flex flex-col items-center gap-1 py-5 text-center select-none">
          <span className="text-muted-foreground text-[11px] font-medium">
            WALLET BALANCE
          </span>
          <p className="text-2xl font-bold">{balanceDisplay}</p>
          {address && (
            <span className="text-[10px] text-muted-foreground mt-1 font-mono">
              {formatTruncatedAddress(address)}
            </span>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Network badge */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-muted-foreground">Network</span>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary capitalize">
            {process.env.NEXT_PUBLIC_STARKNET_NETWORK || "sepolia"}
          </span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountModal;
export { AccountModal };
