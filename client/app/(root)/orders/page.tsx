"use client";

import { useState } from "react";
import { Clock, Package, RefreshCw, CheckCircle2, Timer } from "lucide-react";
import Wrapper from "@/components/shared/wrapper";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import type { IOrder } from "@/lib/types";

const mockOrders: IOrder[] = [
  {
    id: "order-1",
    onChainOrderId: 1,
    buyer: "0x01a2b3c4...",
    farmer: "0x01a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678",
    farmerName: "John Doe",
    token: "USDC",
    amount: 25.98,
    feeAmount: 0.78,
    netAmount: 25.2,
    status: "pending",
    items: [
      { productId: "prod-001", name: "Fresh Tomatoes Basket", quantity: 2, unitPrice: 12.99, image: "https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=100" },
    ],
    createdAt: "2026-04-05T10:00:00Z",
    expiresAt: "2026-04-09T10:00:00Z",
  },
  {
    id: "order-2",
    onChainOrderId: 2,
    buyer: "0x01a2b3c4...",
    farmer: "0x02b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef123456789a",
    farmerName: "Jane Smith",
    token: "USDC",
    amount: 15.75,
    feeAmount: 0.47,
    netAmount: 15.28,
    status: "completed",
    items: [
      { productId: "prod-003", name: "Fresh & Ripe Apples", quantity: 1, unitPrice: 15.75, image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=100" },
    ],
    createdAt: "2026-04-01T08:00:00Z",
    expiresAt: "2026-04-05T08:00:00Z",
  },
];

function OrderCard({ order }: { order: IOrder }) {
  const isPending = order.status === "pending";
  const expiresAt = new Date(order.expiresAt);
  const now = new Date();
  const hoursLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)));

  return (
    <div className="rounded-[28px] border bg-card p-6 transition-all hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-semibold">Order #{order.onChainOrderId}</h3>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            From {order.farmerName} &middot; {new Date(order.createdAt).toLocaleDateString()}
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
          <div key={item.productId} className="flex items-center justify-between text-sm">
            <span>
              {item.name} x{item.quantity}
            </span>
            <span className="font-medium">${(item.unitPrice * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
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

export default function OrdersPage() {
  const [tab, setTab] = useState("all");

  const filtered =
    tab === "all" ? mockOrders : mockOrders.filter((o) => o.status === tab);

  return (
    <div className="pt-28 pb-16">
      <Wrapper>
        <div className="mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">My Orders</h1>
          <p className="text-sm text-muted-foreground">Track your orders and confirm deliveries</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all" className="gap-1.5">
              <Package className="size-4" />
              All
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-1.5">
              <Clock className="size-4" />
              Pending
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-1.5">
              <CheckCircle2 className="size-4" />
              Completed
            </TabsTrigger>
            <TabsTrigger value="refunded" className="gap-1.5">
              <RefreshCw className="size-4" />
              Refunded
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-6">
            {filtered.length > 0 ? (
              <div className="space-y-4">
                {filtered.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Package}
                title="No orders found"
                description="You don't have any orders matching this filter."
              />
            )}
          </TabsContent>
        </Tabs>
      </Wrapper>
    </div>
  );
}
