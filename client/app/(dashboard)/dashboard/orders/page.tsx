"use client";

import { useState } from "react";
import Image from "next/image";
import { Clock, CheckCircle2, RefreshCw, Package, Timer, Sprout, ShoppingBag } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import type { OrderStatus, IOrder } from "@/lib/types";

// ─── Farmer view ───────────────────────────────────────────────────────────

interface FarmerOrder {
  id: number;
  buyer: string;
  product: string;
  amount: number;
  netAmount: number;
  status: OrderStatus;
  date: string;
}

const farmerOrders: FarmerOrder[] = [
  { id: 1, buyer: "0x01a2...5678", product: "Fresh Tomatoes x2", amount: 25.98, netAmount: 25.2, status: "pending", date: "Apr 5, 2026" },
  { id: 2, buyer: "0x02b3...789a", product: "Green Peppers x2", amount: 17.0, netAmount: 16.49, status: "pending", date: "Apr 4, 2026" },
  { id: 3, buyer: "0x03c4...9abc", product: "Farm Fresh Eggs x3", amount: 19.5, netAmount: 18.92, status: "completed", date: "Apr 3, 2026" },
  { id: 4, buyer: "0x04d5...abcd", product: "Fresh Tomatoes x1", amount: 12.99, netAmount: 12.6, status: "completed", date: "Apr 1, 2026" },
  { id: 5, buyer: "0x05e6...bcde", product: "Green Peppers x1", amount: 8.5, netAmount: 8.25, status: "refunded", date: "Mar 28, 2026" },
];

const farmerColumns: ColumnDef<FarmerOrder>[] = [
  {
    accessorKey: "id",
    header: "Order",
    cell: ({ getValue }) => (
      <span className="text-sm font-medium">#{getValue() as number}</span>
    ),
  },
  {
    accessorKey: "buyer",
    header: "Buyer",
    cell: ({ getValue }) => (
      <span className="font-mono text-sm text-muted-foreground">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "product",
    header: "Items",
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
    accessorKey: "netAmount",
    header: "You Receive",
    enableGlobalFilter: false,
    cell: ({ getValue }) => (
      <span className="text-sm font-semibold text-emerald-600">
        ${(getValue() as number).toFixed(2)}
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

function FarmerOrdersView() {
  const [tab, setTab] = useState("all");

  const filtered =
    tab === "all" ? farmerOrders : farmerOrders.filter((o) => o.status === tab);

  const pendingCount = farmerOrders.filter((o) => o.status === "pending").length;
  const completedCount = farmerOrders.filter((o) => o.status === "completed").length;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {pendingCount} pending · {completedCount} completed
      </p>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({farmerOrders.length})</TabsTrigger>
          <TabsTrigger value="pending" className="gap-1.5">
            <Clock className="size-3.5" />
            Pending ({pendingCount})
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

        <TabsContent value={tab} className="mt-6">
          {filtered.length > 0 ? (
            <DataTable
              columns={farmerColumns}
              data={filtered}
              searchPlaceholder="Search by product or buyer..."
              pageSize={10}
            />
          ) : (
            <EmptyState
              icon={Package}
              title="No orders found"
              description="No orders matching this filter."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Buyer view (cards) ─────────────────────────────────────────────────────

const buyerOrders: IOrder[] = [
  {
    id: "order-1",
    onChainOrderId: 1,
    buyer: "0x01a2b3c4...",
    farmer: "0x01a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678",
    farmerName: "GreenFarm NG",
    token: "USDC",
    amount: 25.98,
    feeAmount: 0.78,
    netAmount: 25.2,
    status: "pending",
    items: [
      {
        productId: "prod-001",
        name: "Fresh Tomatoes x2",
        quantity: 2,
        unitPrice: 12.99,
        image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=100",
      },
    ],
    createdAt: "2026-04-05T10:00:00Z",
    expiresAt: "2026-04-09T10:00:00Z",
  },
  {
    id: "order-2",
    onChainOrderId: 2,
    buyer: "0x01a2b3c4...",
    farmer: "0x02b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef123456789a",
    farmerName: "Sunrise Agro",
    token: "USDC",
    amount: 15.75,
    feeAmount: 0.47,
    netAmount: 15.28,
    status: "completed",
    items: [
      {
        productId: "prod-003",
        name: "Fresh Apples x1",
        quantity: 1,
        unitPrice: 15.75,
        image: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=100",
      },
    ],
    createdAt: "2026-04-01T08:00:00Z",
    expiresAt: "2026-04-05T08:00:00Z",
  },
];

function BuyerOrderCard({ order }: { order: IOrder }) {
  const isPending = order.status === "pending";
  const expiresAt = new Date(order.expiresAt);
  const now = new Date();
  const hoursLeft = Math.max(
    0,
    Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)),
  );

  return (
    <div className="rounded-2xl border bg-card p-6 transition-all hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-semibold">Order #{order.onChainOrderId}</h3>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            From {order.farmerName} · {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">${order.amount.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">{order.token}</p>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="space-y-2">
        {order.items.map((item) => (
          <div key={item.productId} className="flex items-center gap-3">
            <div className="relative size-10 overflow-hidden rounded-lg">
              <Image src={item.image} alt={item.name} fill className="object-cover" sizes="40px" />
            </div>
            <div className="flex flex-1 items-center justify-between text-sm">
              <span>{item.name}</span>
              <span className="font-medium">${(item.unitPrice * item.quantity).toFixed(2)}</span>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
          <span>Platform fee (3%)</span>
          <span>${order.feeAmount.toFixed(2)}</span>
        </div>
      </div>

      {isPending && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm" className="gap-1.5">
            <CheckCircle2 className="size-4" />
            Confirm Receipt
          </Button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Timer className="size-3.5" />
            <span>Auto-refund in {hoursLeft}h</span>
          </div>
        </div>
      )}
    </div>
  );
}

function BuyerOrdersView() {
  const [tab, setTab] = useState("all");
  const filtered =
    tab === "all" ? buyerOrders : buyerOrders.filter((o) => o.status === tab);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {buyerOrders.filter((o) => o.status === "pending").length} pending ·{" "}
        {buyerOrders.filter((o) => o.status === "completed").length} completed
      </p>

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

        <TabsContent value={tab} className="mt-6">
          {filtered.length > 0 ? (
            <div className="space-y-4">
              {filtered.map((order) => (
                <BuyerOrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="No orders"
              description="You don't have any orders here."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [view, setView] = useState<"farmer" | "buyer">("farmer");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Tabs value={view} onValueChange={(v) => setView(v as "farmer" | "buyer")}>
          <TabsList>
            <TabsTrigger value="farmer" className="gap-1.5">
              <Sprout className="size-3.5" />
              Incoming
            </TabsTrigger>
            <TabsTrigger value="buyer" className="gap-1.5">
              <ShoppingBag className="size-3.5" />
              My Purchases
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "farmer" ? <FarmerOrdersView /> : <BuyerOrdersView />}
    </div>
  );
}
