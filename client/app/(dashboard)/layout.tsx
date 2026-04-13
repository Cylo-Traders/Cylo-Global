"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "@starknet-react/core";
import { DashboardSidebar } from "./_components/dashboard-sidebar";
import { DashboardHeader } from "./_components/dashboard-header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isConnected, isReconnecting } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!isReconnecting && !isConnected) {
      router.replace("/");
    }
  }, [isConnected, isReconnecting, router]);

  if (!isConnected) return null;

  return (
    <div className="flex h-screen">
      <div className="hidden lg:block">
        <DashboardSidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
