"use client";

import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingBag } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import {
  RevenueAreaChart,
  OrdersBarChart,
  CategoryPieChart,
  UsersGrowthChart,
} from "@/components/shared/charts";

const monthlyData = [
  { month: "Jan", volume: 8200, revenue: 246, completed: 320, pending: 60, refunded: 32 },
  { month: "Feb", volume: 11400, revenue: 342, completed: 460, pending: 78, refunded: 32 },
  { month: "Mar", volume: 15800, revenue: 474, completed: 640, pending: 98, refunded: 52 },
  { month: "Apr", volume: 48290, revenue: 1448, completed: 1720, pending: 290, refunded: 109 },
];

const usersGrowthData = [
  { month: "Jan", farmers: 24, buyers: 65 },
  { month: "Feb", farmers: 38, buyers: 86 },
  { month: "Mar", farmers: 61, buyers: 137 },
  { month: "Apr", farmers: 89, buyers: 747 },
];

const categoryData = [
  { name: "Vegetables", value: 42, color: "#10b981" },
  { name: "Roots & Tubers", value: 28, color: "#f59e0b" },
  { name: "Fruits", value: 15, color: "#f97316" },
  { name: "Poultry & Eggs", value: 10, color: "#3b82f6" },
  { name: "Others", value: 5, color: "#8b5cf6" },
];

const topFarmers = [
  { name: "GreenFarm NG", wallet: "0x1a2b...3c4d", sales: "$4,290", orders: 312, rating: 4.9 },
  { name: "Sunrise Agro", wallet: "0x5e6f...7a8b", sales: "$3,812", orders: 278, rating: 4.8 },
  { name: "OrganicHub", wallet: "0x9c0d...1e2f", sales: "$2,940", orders: 201, rating: 4.7 },
  { name: "NatureCrop", wallet: "0x3g4h...5i6j", sales: "$2,100", orders: 178, rating: 4.6 },
  { name: "FreshRoots", wallet: "0x7k8l...9m0n", sales: "$1,890", orders: 143, rating: 4.5 },
];

const latest = monthlyData[monthlyData.length - 1];
const prev = monthlyData[monthlyData.length - 2];

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Analytics" description="Platform performance metrics and trends" />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Monthly Volume",
            value: `$${latest.volume.toLocaleString()}`,
            change: `+${(((latest.volume - prev.volume) / prev.volume) * 100).toFixed(1)}% vs last month`,
            icon: DollarSign,
          },
          {
            label: "Monthly Orders",
            value: (latest.completed + latest.pending + latest.refunded).toLocaleString(),
            change: `+${((((latest.completed + latest.pending + latest.refunded) - (prev.completed + prev.pending + prev.refunded)) / (prev.completed + prev.pending + prev.refunded)) * 100).toFixed(1)}% vs last month`,
            icon: ShoppingBag,
          },
          {
            label: "New Users",
            value: (usersGrowthData[usersGrowthData.length - 1].farmers + usersGrowthData[usersGrowthData.length - 1].buyers).toLocaleString(),
            change: "This month",
            icon: Users,
          },
          {
            label: "Revenue (3%)",
            value: `$${latest.revenue.toLocaleString()}`,
            change: `+${(((latest.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1)}% vs last month`,
            icon: TrendingUp,
          },
        ].map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Volume & Revenue chart */}
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="mb-1 font-semibold">Volume & Revenue Trend</h2>
        <p className="mb-5 text-xs text-muted-foreground">Monthly transaction volume vs platform revenue earned</p>
        <RevenueAreaChart data={monthlyData} />
      </div>

      {/* Orders + Users growth side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="mb-1 font-semibold">Orders Breakdown</h2>
          <p className="mb-5 text-xs text-muted-foreground">Completed, pending and refunded orders by month</p>
          <OrdersBarChart data={monthlyData} />
        </div>
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="mb-1 font-semibold">User Growth</h2>
          <p className="mb-5 text-xs text-muted-foreground">Farmers vs buyers joining the platform</p>
          <UsersGrowthChart data={usersGrowthData} />
        </div>
      </div>

      {/* Category pie + Top farmers side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="mb-1 font-semibold">Sales by Category</h2>
          <p className="mb-5 text-xs text-muted-foreground">Distribution of orders across product categories</p>
          <CategoryPieChart data={categoryData} />
        </div>

        <div className="rounded-2xl border bg-card">
          <div className="p-6">
            <h2 className="font-semibold">Top Farmers</h2>
            <p className="text-xs text-muted-foreground">Ranked by total sales volume</p>
          </div>
          <Separator />
          <div className="divide-y">
            {topFarmers.map((farmer, i) => (
              <div key={farmer.wallet} className="flex items-center gap-4 px-6 py-3">
                <span className="w-5 shrink-0 text-sm font-medium text-muted-foreground">
                  #{i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{farmer.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{farmer.wallet}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-600">{farmer.sales}</p>
                  <p className="text-xs text-muted-foreground">{farmer.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly table */}
      <div className="rounded-2xl border bg-card">
        <div className="p-6">
          <h2 className="font-semibold">Monthly Trend Table</h2>
        </div>
        <Separator />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4">Month</th>
                <th className="px-6 py-4">Volume</th>
                <th className="px-6 py-4">Completed</th>
                <th className="px-6 py-4">Pending</th>
                <th className="px-6 py-4">Refunded</th>
                <th className="px-6 py-4">Revenue (3%)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {monthlyData.map((row) => (
                <tr key={row.month} className="hover:bg-accent/50">
                  <td className="px-6 py-3 text-sm font-medium">{row.month} 2026</td>
                  <td className="px-6 py-3 text-sm">${row.volume.toLocaleString()}</td>
                  <td className="px-6 py-3 text-sm text-emerald-600">{row.completed}</td>
                  <td className="px-6 py-3 text-sm text-amber-600">{row.pending}</td>
                  <td className="px-6 py-3 text-sm text-red-500">{row.refunded}</td>
                  <td className="px-6 py-3 text-sm font-semibold text-emerald-600">
                    ${row.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
