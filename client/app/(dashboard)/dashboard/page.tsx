"use client";

import { DollarSign, Package, ShoppingBag, TrendingUp, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";

const stats = [
  { label: "Total Revenue", value: "$1,247.50", icon: DollarSign, change: "+12.5%" },
  { label: "Active Products", value: "8", icon: Package, change: "+2" },
  { label: "Total Orders", value: "45", icon: ShoppingBag, change: "+5" },
  { label: "Pending Orders", value: "3", icon: TrendingUp, change: "Active" },
];

const recentOrders = [
  { id: 1, buyer: "0x01a2...5678", product: "Fresh Tomatoes", amount: 25.98, status: "pending" as const, date: "Apr 5, 2026" },
  { id: 2, buyer: "0x02b3...789a", product: "Green Peppers", amount: 17.0, status: "completed" as const, date: "Apr 3, 2026" },
  { id: 3, buyer: "0x03c4...9abc", product: "Farm Fresh Eggs", amount: 13.0, status: "completed" as const, date: "Apr 1, 2026" },
];

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back! Here&apos;s your farm overview.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border bg-card p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <div className="rounded-lg bg-primary/10 p-2">
                <stat.icon className="size-4 text-primary" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
            <p className="mt-1 text-xs text-emerald-600">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between p-6">
          <h2 className="font-semibold">Recent Orders</h2>
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link href="/dashboard/orders">
              View All <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <Separator />
        <div className="divide-y">
          {recentOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium">Order #{order.id}</p>
                <p className="text-xs text-muted-foreground">
                  {order.product} &middot; {order.buyer}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={order.status} />
                <span className="text-sm font-semibold">${order.amount.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
