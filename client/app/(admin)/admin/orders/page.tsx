"use client";

import { useState } from "react";
import { Clock, CheckCircle2, RefreshCw, AlertTriangle } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import type { OrderStatus } from "@/lib/types";

interface AdminOrder {
  id: string;
  farmer: string;
  buyer: string;
  product: string;
  amount: number;
  fee: number;
  netToFarmer: number;
  status: OrderStatus;
  token: string;
  date: string;
  expiresIn?: string;
}

const mockOrders: AdminOrder[] = [
  { id: "ORD-9021", farmer: "GreenFarm NG", buyer: "0x1a2b...3c4d", product: "Fresh Tomatoes x5", amount: 64.95, fee: 1.95, netToFarmer: 63.0, status: "pending", token: "USDC", date: "Apr 10, 2026", expiresIn: "72h left" },
  { id: "ORD-9020", farmer: "Sunrise Agro", buyer: "0x5e6f...7a8b", product: "Cassava x10", amount: 30.0, fee: 0.9, netToFarmer: 29.1, status: "completed", token: "STRK", date: "Apr 9, 2026" },
  { id: "ORD-9019", farmer: "OrganicHub", buyer: "0x9c0d...1e2f", product: "Pepper x3", amount: 25.5, fee: 0.77, netToFarmer: 24.73, status: "completed", token: "USDC", date: "Apr 9, 2026" },
  { id: "ORD-9018", farmer: "GreenFarm NG", buyer: "0x3g4h...5i6j", product: "Yam x8", amount: 48.0, fee: 1.44, netToFarmer: 46.56, status: "refunded", token: "USDC", date: "Apr 8, 2026" },
  { id: "ORD-9017", farmer: "NatureCrop", buyer: "0x7k8l...9m0n", product: "Spinach x2", amount: 11.98, fee: 0.36, netToFarmer: 11.62, status: "pending", token: "STRK", date: "Apr 8, 2026", expiresIn: "18h left" },
  { id: "ORD-9016", farmer: "FreshRoots", buyer: "0x1m2n...3o4p", product: "Sweet Potatoes x4", amount: 19.96, fee: 0.6, netToFarmer: 19.36, status: "completed", token: "USDC", date: "Apr 7, 2026" },
  { id: "ORD-9015", farmer: "Sunrise Agro", buyer: "0x5q6r...7s8t", product: "Plantain x6", amount: 23.94, fee: 0.72, netToFarmer: 23.22, status: "completed", token: "STRK", date: "Apr 6, 2026" },
];

const columns: ColumnDef<AdminOrder>[] = [
  {
    accessorKey: "id",
    header: "Order",
    cell: ({ getValue }) => (
      <span className="text-sm font-semibold">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "farmer",
    header: "Farmer",
    cell: ({ getValue }) => <span className="text-sm">{getValue() as string}</span>,
  },
  {
    accessorKey: "buyer",
    header: "Buyer",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "product",
    header: "Product",
    cell: ({ getValue }) => <span className="text-sm">{getValue() as string}</span>,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    enableGlobalFilter: false,
    cell: ({ getValue }) => (
      <span className="text-sm font-medium">${(getValue() as number).toFixed(2)}</span>
    ),
  },
  {
    accessorKey: "fee",
    header: "Fee (3%)",
    enableGlobalFilter: false,
    cell: ({ getValue }) => (
      <span className="text-sm text-emerald-600">${(getValue() as number).toFixed(2)}</span>
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
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <StatusBadge status={row.original.status} />
        {row.original.expiresIn && (
          <span className="flex items-center gap-1 text-xs text-amber-600">
            <AlertTriangle className="size-3" />
            {row.original.expiresIn}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">{getValue() as string}</span>
    ),
  },
];

export default function AdminOrdersPage() {
  const [tab, setTab] = useState("all");

  const filtered =
    tab === "all" ? mockOrders : mockOrders.filter((o) => o.status === tab);

  const pending = mockOrders.filter((o) => o.status === "pending");
  const totalEscrow = pending.reduce((s, o) => s + o.amount, 0);
  const totalRevenue = mockOrders
    .filter((o) => o.status === "completed")
    .reduce((s, o) => s + o.fee, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Orders</h1>
        <p className="text-sm text-muted-foreground">
          {pending.length} pending in escrow (${totalEscrow.toFixed(2)}) · $
          {totalRevenue.toFixed(2)} collected in fees
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Orders", value: mockOrders.length, icon: CheckCircle2, color: "text-primary" },
          { label: "Pending", value: mockOrders.filter((o) => o.status === "pending").length, icon: Clock, color: "text-amber-600" },
          { label: "Completed", value: mockOrders.filter((o) => o.status === "completed").length, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Refunded", value: mockOrders.filter((o) => o.status === "refunded").length, icon: RefreshCw, color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={`size-4 ${s.color}`} />
            </div>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending" className="gap-1.5">
            <Clock className="size-3.5" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-1.5">
            <CheckCircle2 className="size-3.5" />
            Completed
          </TabsTrigger>
          <TabsTrigger value="refunded" className="gap-1.5">
            <RefreshCw className="size-3.5" />
            Refunded
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search by ID, farmer, buyer, product..."
        pageSize={10}
      />
    </div>
  );
}
