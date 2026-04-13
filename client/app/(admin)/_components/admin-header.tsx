"use client";

import { Menu, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AdminSidebar } from "./admin-sidebar";

export function AdminHeader() {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <AdminSidebar />
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-2 lg:hidden">
        <ShieldCheck className="text-primary size-4" />
        <span className="text-sm font-semibold">Admin Panel</span>
      </div>

      <div className="flex-1" />
      <ThemeToggle />
      <div className="flex items-center gap-2 rounded-xl border bg-muted/50 px-3 py-1.5">
        <ShieldCheck className="text-primary size-4" />
        <span className="text-xs font-medium">Cylo Admin</span>
      </div>
    </header>
  );
}
