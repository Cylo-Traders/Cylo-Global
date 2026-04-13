"use client";

import { DollarSign, TrendingUp, Clock, ArrowDownToLine } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable } from "@/components/shared/data-table";
import { EarningsLineChart } from "@/components/shared/charts";
import type { OrderStatus } from "@/lib/types";

const PLATFORM_FEE = 0.03;

interface Payout {
  id: number;
  product: string;
  gross: number;
  fee: number;
  net: number;
  token: string;
  status: OrderStatus;
  date: string;
}

const payouts: Payout[] = [
  { id: 1, product: "Fresh Tomatoes x2", gross: 25.98, fee: 0.78, net: 25.2, token: "USDC", status: "completed", date: "Apr 5, 2026" },
  { id: 2, product: "Green Peppers x2", gross: 17.0, fee: 0.51, net: 16.49, token: "STRK", status: "completed", date: "Apr 3, 2026" },
  { id: 3, product: "Farm Fresh Eggs x3", gross: 19.5, fee: 0.58, net: 18.92, token: "USDC", status: "completed", date: "Apr 1, 2026" },
  { id: 4, product: "Fresh Tomatoes x1", gross: 12.99, fee: 0.39, net: 12.6, token: "USDC", status: "pending", date: "Apr 8, 2026" },
  { id: 5, product: "Green Peppers x1", gross: 8.5, fee: 0.25, net: 8.25, token: "STRK", status: "refunded", date: "Mar 28, 2026" },
];

const totalEarned = payouts
  .filter((p) => p.status === "completed")
  .reduce((s, p) => s + p.net, 0);
const pendingEarnings = payouts
  .filter((p) => p.status === "pending")
  .reduce((s, p) => s + p.net, 0);
const totalFees = payouts
  .filter((p) => p.status === "completed")
  .reduce((s, p) => s + p.fee, 0);

const monthlyData = [
  { month: "Jan", gross: 112.5, net: 102.5 },
  { month: "Feb", gross: 210.0, net: 198.2 },
  { month: "Mar", gross: 165.0, net: 154.8 },
  { month: "Apr", gross: totalEarned + totalFees, net: totalEarned },
];

const columns: ColumnDef<Payout>[] = [
  {
    accessorKey: "id",
    header: "Order",
    cell: ({ getValue }) => (
      <span className="text-sm font-medium">#{getValue() as number}</span>
    ),
  },
  {
    accessorKey: "product",
    header: "Product",
    cell: ({ getValue }) => <span className="text-sm">{getValue() as string}</span>,
  },
  {
    accessorKey: "gross",
    header: "Gross",
    cell: ({ getValue }) => (
      <span className="text-sm">${(getValue() as number).toFixed(2)}</span>
    ),
  },
  {
    accessorKey: "fee",
    header: "Fee (3%)",
    enableGlobalFilter: false,
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">-${(getValue() as number).toFixed(2)}</span>
    ),
  },
  {
    accessorKey: "net",
    header: "Net",
    enableGlobalFilter: false,
    cell: ({ getValue }) => (
      <span className="text-sm font-semibold text-emerald-600">
        ${(getValue() as number).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "token",
    header: "Token",
    cell: ({ getValue }) => (
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    enableGlobalFilter: false,
    cell: ({ getValue }) => <StatusBadge status={getValue() as OrderStatus} />,
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">{getValue() as string}</span>
    ),
  },
];

export default function EarningsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Earnings"
        description="Your income breakdown after platform fees"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Earned"
          value={`$${totalEarned.toFixed(2)}`}
          change="All time (net)"
          icon={DollarSign}
          iconBgClassName="bg-emerald-100 dark:bg-emerald-900/30"
          iconClassName="text-emerald-600"
        />
        <StatCard
          label="Pending"
          value={`$${pendingEarnings.toFixed(2)}`}
          change="Awaiting buyer confirmation"
          changeClassName="text-amber-600"
          icon={Clock}
          iconBgClassName="bg-amber-100 dark:bg-amber-900/30"
          iconClassName="text-amber-600"
        />
        <StatCard
          label="Platform Fees Paid"
          value={`$${totalFees.toFixed(2)}`}
          change="3% per completed order"
          changeClassName="text-muted-foreground"
          icon={TrendingUp}
        />
        <StatCard
          label="This Month"
          value={`$${totalEarned.toFixed(2)}`}
          change="April 2026"
          icon={ArrowDownToLine}
        />
      </div>

      {/* Monthly chart */}
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="mb-1 font-semibold">Monthly Earnings</h2>
        <p className="mb-5 text-xs text-muted-foreground">
          Gross income vs net after platform fee
        </p>
        <EarningsLineChart data={monthlyData} />
      </div>

      {/* Payout history */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Payout History</h2>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowDownToLine className="size-3.5" />
            Export CSV
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={payouts}
          searchPlaceholder="Search by product or token..."
          pageSize={10}
        />
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800/30 dark:bg-amber-900/10">
        <h3 className="mb-2 font-semibold text-amber-900 dark:text-amber-400">
          How Earnings Work
        </h3>
        <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-500">
          <li>• Funds are locked in smart contract escrow when a buyer places an order.</li>
          <li>• Once the buyer confirms receipt, funds are released to your wallet automatically.</li>
          <li>• Cylo charges a 3% platform fee per completed order.</li>
          <li>• If a buyer doesn&apos;t confirm within 96 hours, the order auto-refunds.</li>
        </ul>
      </div>
    </div>
  );
}
