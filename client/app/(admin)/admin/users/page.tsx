"use client";

import { useState } from "react";
import { UserCheck, UserX, MoreHorizontal } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/shared/data-table";

interface User {
  wallet: string;
  displayName: string;
  role: "farmer" | "buyer";
  country: string;
  joined: string;
  orders: number;
  volume: string;
  status: "active" | "suspended";
}

const mockUsers: User[] = [
  { wallet: "0x1a2b3c4d5e6f7a8b9c0d1e2f", displayName: "GreenFarm NG", role: "farmer", country: "Nigeria", joined: "Jan 5, 2026", orders: 312, volume: "$4,290", status: "active" },
  { wallet: "0x5e6f7a8b9c0d1e2f3a4b5c6d", displayName: "Sunrise Agro", role: "farmer", country: "Ghana", joined: "Feb 12, 2026", orders: 278, volume: "$3,812", status: "active" },
  { wallet: "0x9c0d1e2f3a4b5c6d7e8f9a0b", displayName: "John Buyer", role: "buyer", country: "USA", joined: "Mar 1, 2026", orders: 14, volume: "$412", status: "active" },
  { wallet: "0x3a4b5c6d7e8f9a0b1c2d3e4f", displayName: "OrganicHub", role: "farmer", country: "Kenya", joined: "Mar 8, 2026", orders: 201, volume: "$2,940", status: "active" },
  { wallet: "0x7e8f9a0b1c2d3e4f5a6b7c8d", displayName: "NatureCrop", role: "farmer", country: "Nigeria", joined: "Mar 15, 2026", orders: 143, volume: "$1,890", status: "active" },
  { wallet: "0x1c2d3e4f5a6b7c8d9e0f1a2b", displayName: "Jane Doe", role: "buyer", country: "UK", joined: "Apr 2, 2026", orders: 3, volume: "$89", status: "active" },
  { wallet: "0x5a6b7c8d9e0f1a2b3c4d5e6f", displayName: "BadActor99", role: "buyer", country: "Unknown", joined: "Apr 5, 2026", orders: 0, volume: "$0", status: "suspended" },
];

const columns: ColumnDef<User>[] = [
  {
    id: "user",
    accessorFn: (row) => `${row.displayName} ${row.wallet} ${row.country}`,
    header: "User",
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-medium">{row.original.displayName}</p>
        <p className="font-mono text-xs text-muted-foreground">
          {row.original.wallet.slice(0, 14)}...
        </p>
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ getValue }) => {
      const role = getValue() as string;
      return (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
            role === "farmer"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          }`}
        >
          {role}
        </span>
      );
    },
  },
  {
    accessorKey: "country",
    header: "Country",
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "joined",
    header: "Joined",
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "orders",
    header: "Orders",
    enableGlobalFilter: false,
    cell: ({ getValue }) => <span className="text-sm">{getValue() as number}</span>,
  },
  {
    accessorKey: "volume",
    header: "Volume",
    enableGlobalFilter: false,
    cell: ({ getValue }) => <span className="text-sm font-medium">{getValue() as string}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    enableGlobalFilter: false,
    cell: ({ getValue }) => {
      const status = getValue() as string;
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            status === "active"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {status === "active" ? <UserCheck className="size-3" /> : <UserX className="size-3" />}
          {status}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    enableGlobalFilter: false,
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Profile</DropdownMenuItem>
              <DropdownMenuItem>View Orders</DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.status === "active" ? (
                <DropdownMenuItem className="text-destructive">Suspend User</DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="text-emerald-600">Reinstate User</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export default function AdminUsersPage() {
  const [tab, setTab] = useState("all");

  const filtered = mockUsers.filter((u) => {
    if (tab === "all") return true;
    if (tab === "farmer" || tab === "buyer") return u.role === tab;
    if (tab === "suspended") return u.status === "suspended";
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">
          {mockUsers.filter((u) => u.role === "farmer").length} farmers ·{" "}
          {mockUsers.filter((u) => u.role === "buyer").length} buyers ·{" "}
          {mockUsers.filter((u) => u.status === "suspended").length} suspended
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({mockUsers.length})</TabsTrigger>
          <TabsTrigger value="farmer">Farmers</TabsTrigger>
          <TabsTrigger value="buyer">Buyers</TabsTrigger>
          <TabsTrigger value="suspended">Suspended</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search by name, wallet, country..."
        pageSize={10}
      />
    </div>
  );
}
