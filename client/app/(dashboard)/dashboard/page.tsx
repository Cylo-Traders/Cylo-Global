"use client";

import Link from "next/link";
import { DollarSign, Package, ShoppingBag, TrendingUp, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EarningsLineChart, OrdersBarChart } from "@/components/shared/charts";

const stats = [
  { label: "Total Revenue", value: "$1,247.50", icon: DollarSign, change: "+12.5% this month" },
  { label: "Active Products", value: "8", icon: Package, change: "+2 this week" },
  { label: "Total Orders", value: "45", icon: ShoppingBag, change: "+5 this week" },
  { label: "Pending Orders", value: "3", icon: TrendingUp, change: "Awaiting confirmation" },
];

const earningsData = [
  { month: "Jan", gross: 112.5, net: 109.1 },
  { month: "Feb", gross: 198.2, net: 192.3 },
  { month: "Mar", gross: 165.0, net: 160.1 },
  { month: "Apr", gross: 214.0, net: 207.6 },
  { month: "May", gross: 178.5, net: 173.1 },
  { month: "Jun", gross: 248.9, net: 241.4 },
];

const ordersData = [
  { month: "Jan", completed: 8, pending: 2, refunded: 1 },
  { month: "Feb", completed: 14, pending: 3, refunded: 0 },
  { month: "Mar", completed: 11, pending: 1, refunded: 2 },
  { month: "Apr", completed: 18, pending: 3, refunded: 1 },
  { month: "May", completed: 13, pending: 2, refunded: 0 },
  { month: "Jun", completed: 22, pending: 4, refunded: 1 },
];

const recentOrders = [
  { id: 1, buyer: "0x01a2...5678", product: "Fresh Tomatoes", amount: 25.98, status: "pending" as const, date: "Apr 5, 2026" },
  { id: 2, buyer: "0x02b3...789a", product: "Green Peppers", amount: 17.0, status: "completed" as const, date: "Apr 3, 2026" },
  { id: 3, buyer: "0x03c4...9abc", product: "Farm Fresh Eggs", amount: 13.0, status: "completed" as const, date: "Apr 1, 2026" },
];

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Welcome back! Here's your farm overview." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="mb-4 font-semibold">Earnings Overview</h2>
          <EarningsLineChart data={earningsData} />
        </div>
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="mb-4 font-semibold">Orders Breakdown</h2>
          <OrdersBarChart data={ordersData} />
        </div>
      </div>

      {/* Recent Orders */}
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
