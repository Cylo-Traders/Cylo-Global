import Link from "next/link";
import {
  Users,
  ShoppingBag,
  Package,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Activity,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";

export const metadata = { title: "Overview" };

const kpis = [
  { label: "Total Volume (TVL)", value: "$48,290.00", change: "+18.4% this month", icon: DollarSign },
  { label: "Platform Revenue", value: "$1,448.70", change: "+18.4% (3% fee)", icon: TrendingUp },
  { label: "Total Users", value: "1,247", change: "+63 this week", icon: Users },
  { label: "Active Products", value: "384", change: "+12 listed today", icon: Package },
  { label: "Total Orders", value: "3,891", change: "+245 this week", icon: ShoppingBag },
  { label: "Pending Escrow", value: "$6,130.40", change: "87 active orders", icon: Shield },
];

const recentOrders = [
  { id: "ORD-9021", farmer: "GreenFarm NG", buyer: "0x1a2b...3c4d", product: "Tomatoes x5", amount: 64.95, status: "pending" as const, date: "Apr 10, 2026" },
  { id: "ORD-9020", farmer: "Sunrise Agro", buyer: "0x5e6f...7a8b", product: "Cassava x10", amount: 30.0, status: "completed" as const, date: "Apr 9, 2026" },
  { id: "ORD-9019", farmer: "OrganicHub", buyer: "0x9c0d...1e2f", product: "Pepper x3", amount: 25.5, status: "completed" as const, date: "Apr 9, 2026" },
  { id: "ORD-9018", farmer: "GreenFarm NG", buyer: "0x3g4h...5i6j", product: "Yam x8", amount: 48.0, status: "refunded" as const, date: "Apr 8, 2026" },
  { id: "ORD-9017", farmer: "NatureCrop", buyer: "0x7k8l...9m0n", product: "Spinach x2", amount: 11.98, status: "pending" as const, date: "Apr 8, 2026" },
];

const recentUsers = [
  { wallet: "0x1a2b...3c4d", role: "Buyer", joined: "Apr 10", orders: 4 },
  { wallet: "0x5e6f...7a8b", role: "Farmer", joined: "Apr 9", orders: 12 },
  { wallet: "0x9c0d...1e2f", role: "Buyer", joined: "Apr 9", orders: 1 },
  { wallet: "0x3g4h...5i6j", role: "Farmer", joined: "Apr 8", orders: 7 },
];

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Platform Overview"
        description={`Real-time analytics — ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card">
          <div className="flex items-center justify-between p-6">
            <h2 className="font-semibold">Recent Orders</h2>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/admin/orders">
                View All <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </div>
          <Separator />
          <div className="divide-y">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between px-6 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{order.id}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {order.farmer} → {order.buyer}
                  </p>
                </div>
                <div className="ml-4 flex shrink-0 items-center gap-3">
                  <StatusBadge status={order.status} />
                  <span className="text-sm font-semibold">${order.amount.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-card">
          <div className="flex items-center justify-between p-6">
            <h2 className="font-semibold">New Users</h2>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/admin/users">
                View All <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </div>
          <Separator />
          <div className="divide-y">
            {recentUsers.map((user) => (
              <div key={user.wallet} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="font-mono text-sm font-medium">{user.wallet}</p>
                  <p className="text-xs text-muted-foreground">Joined {user.joined}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.role === "Farmer"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                  >
                    {user.role}
                  </span>
                  <span className="text-xs text-muted-foreground">{user.orders} orders</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">Platform Health</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {[
            { label: "Escrow Success Rate", value: "96.2%", status: "healthy" },
            { label: "Auto-Refund Rate", value: "3.8%", status: "warning" },
            { label: "Dispute Rate", value: "0.4%", status: "healthy" },
            { label: "Avg Order Value", value: "$12.41", status: "healthy" },
          ].map((metric) => (
            <div key={metric.label} className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="mt-1 text-xl font-bold">{metric.value}</p>
              <div
                className={`mt-1 flex items-center gap-1 text-xs ${
                  metric.status === "healthy" ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                <Activity className="size-3" />
                {metric.status === "healthy" ? "Healthy" : "Monitor"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
