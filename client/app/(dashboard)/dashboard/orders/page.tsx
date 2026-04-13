"use client";

import { useState } from "react";
import { Clock, CheckCircle2, RefreshCw, Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import type { OrderStatus } from "@/lib/types";

interface FarmerOrder {
  id: number;
  buyer: string;
  product: string;
  amount: number;
  netAmount: number;
  status: OrderStatus;
  date: string;
}

const mockOrders: FarmerOrder[] = [
  { id: 1, buyer: "0x01a2...5678", product: "Fresh Tomatoes x2", amount: 25.98, netAmount: 25.2, status: "pending", date: "Apr 5, 2026" },
  { id: 2, buyer: "0x02b3...789a", product: "Green Peppers x2", amount: 17.0, netAmount: 16.49, status: "pending", date: "Apr 4, 2026" },
  { id: 3, buyer: "0x03c4...9abc", product: "Farm Fresh Eggs x3", amount: 19.5, netAmount: 18.92, status: "completed", date: "Apr 3, 2026" },
  { id: 4, buyer: "0x04d5...abcd", product: "Fresh Tomatoes x1", amount: 12.99, netAmount: 12.6, status: "completed", date: "Apr 1, 2026" },
  { id: 5, buyer: "0x05e6...bcde", product: "Green Peppers x1", amount: 8.5, netAmount: 8.25, status: "refunded", date: "Mar 28, 2026" },
];

export default function FarmerOrdersPage() {
  const [tab, setTab] = useState("all");

  const filtered = tab === "all" ? mockOrders : mockOrders.filter((o) => o.status === tab);

  const pendingCount = mockOrders.filter((o) => o.status === "pending").length;
  const completedCount = mockOrders.filter((o) => o.status === "completed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Incoming Orders</h1>
        <p className="text-sm text-muted-foreground">
          {pendingCount} pending &middot; {completedCount} completed
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({mockOrders.length})</TabsTrigger>
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
            <div className="rounded-2xl border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-4">Order</th>
                      <th className="px-6 py-4">Buyer</th>
                      <th className="px-6 py-4">Items</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">You Receive</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map((order) => (
                      <tr key={order.id} className="hover:bg-accent/50">
                        <td className="px-6 py-4 text-sm font-medium">#{order.id}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{order.buyer}</td>
                        <td className="px-6 py-4 text-sm">{order.product}</td>
                        <td className="px-6 py-4 text-sm font-medium">${order.amount.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-emerald-600">
                          ${order.netAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{order.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
