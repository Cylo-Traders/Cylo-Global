"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, Trash2, MoreHorizontal, Package } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import productsData from "@/lib/data/products.json";
import type { IProduct } from "@/lib/types";

const products = productsData as IProduct[];

const columns: ColumnDef<IProduct>[] = [
  {
    id: "product",
    accessorFn: (row) => `${row.name} ${row.category}`,
    header: "Product",
    cell: ({ row }) => {
      const p = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-lg">
            <Image src={p.image} alt={p.name} fill className="object-cover" sizes="40px" />
          </div>
          <div>
            <p className="text-sm font-medium">{p.name}</p>
            <p className="text-xs text-muted-foreground">/{p.unit}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ getValue }) => (
      <span className="text-sm capitalize">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "price",
    header: "Price",
    enableGlobalFilter: false,
    cell: ({ getValue }) => (
      <span className="text-sm font-medium">${(getValue() as number).toFixed(2)}</span>
    ),
  },
  {
    accessorKey: "stockQuantity",
    header: "Stock",
    enableGlobalFilter: false,
    cell: ({ getValue }) => <span className="text-sm">{getValue() as number}</span>,
  },
  {
    accessorKey: "rating",
    header: "Rating",
    enableGlobalFilter: false,
    cell: ({ getValue }) => <span className="text-sm">⭐ {getValue() as number}</span>,
  },
  {
    accessorKey: "currency",
    header: "Token",
    cell: ({ getValue }) => (
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "isAvailable",
    header: "Status",
    enableGlobalFilter: false,
    cell: ({ getValue }) =>
      getValue() ? (
        <Badge variant="success">Active</Badge>
      ) : (
        <Badge variant="secondary">Inactive</Badge>
      ),
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    enableGlobalFilter: false,
    cell: ({ row }) => {
      const p = row.original;
      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2">
                {p.isAvailable ? (
                  <>
                    <EyeOff className="size-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Eye className="size-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-destructive">
                <Trash2 className="size-4" />
                Remove Listing
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export default function AdminProductsPage() {
  const [tab, setTab] = useState("all");

  const filtered = products.filter((p) => {
    if (tab === "all") return true;
    if (tab === "active") return p.isAvailable;
    if (tab === "inactive") return !p.isAvailable;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Products</h1>
        <p className="text-sm text-muted-foreground">
          {products.filter((p) => p.isAvailable).length} active ·{" "}
          {products.filter((p) => !p.isAvailable).length} inactive
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({products.length})</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length > 0 ? (
        <DataTable
          columns={columns}
          data={filtered}
          searchPlaceholder="Search by name or category..."
          pageSize={10}
        />
      ) : (
        <EmptyState
          icon={Package}
          title="No products found"
          description="No products matching this filter."
        />
      )}
    </div>
  );
}
