"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2, AlertCircle } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import Wrapper from "@/components/shared/wrapper";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/shared/empty-state";
import { PLATFORM_FEE_PERCENT } from "@/lib/constants";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCartStore();

  const totalPrice = getTotalPrice();
  const feeAmount = totalPrice * (PLATFORM_FEE_PERCENT / 100);
  const grandTotal = totalPrice + feeAmount;

  const groupedByFarmer = useMemo(() => {
    const map = new Map<string, { farmer: typeof items[0]["farmer"]; items: typeof items }>();
    for (const item of items) {
      const key = item.farmer.wallet;
      const group = map.get(key) || { farmer: item.farmer, items: [] };
      group.items.push(item);
      map.set(key, group);
    }
    return Array.from(map.values());
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="pt-28">
        <Wrapper>
          <EmptyState
            icon={ShoppingCart}
            title="Your cart is empty"
            description="Browse the marketplace to find fresh produce from verified farmers."
            action={
              <Button asChild>
                <Link href="/market">Browse Products</Link>
              </Button>
            }
          />
        </Wrapper>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-16">
      <Wrapper>
        <div className="mb-8">
          <Link href="/market" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Back to Marketplace
          </Link>
          <h1 className="text-2xl font-bold sm:text-3xl">Shopping Cart</h1>
          <p className="text-sm text-muted-foreground">{items.length} item(s) in your cart</p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1 space-y-6">
            {groupedByFarmer.map(({ farmer, items: farmerItems }) => (
              <div key={farmer.wallet} className="rounded-[28px] border bg-card p-6">
                <Link
                  href={`/market/${farmer.wallet}`}
                  className="mb-4 flex items-center gap-3"
                >
                  <Image
                    src={farmer.avatar}
                    alt={farmer.displayName}
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                  <div>
                    <p className="text-sm font-semibold">{farmer.displayName}</p>
                    <p className="text-xs text-muted-foreground">{farmer.country}</p>
                  </div>
                </Link>

                <div className="space-y-4">
                  {farmerItems.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl">
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ${item.price.toFixed(2)} / {item.unit}
                        </p>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="flex size-8 items-center justify-center rounded-lg border hover:bg-accent"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="flex size-8 items-center justify-center rounded-lg border hover:bg-accent"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <Button variant="ghost" size="sm" onClick={clearCart}>
              Clear Cart
            </Button>
          </div>

          <aside className="w-full lg:w-80">
            <div className="sticky top-28 rounded-[28px] border bg-card p-6">
              <h2 className="mb-4 text-lg font-bold">Order Summary</h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform Fee ({PLATFORM_FEE_PERCENT}%)</span>
                  <span>${feeAmount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-lg">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                  <p className="text-xs text-amber-800 dark:text-amber-400">
                    Funds will be locked in escrow until you confirm receipt. Auto-refund after 96 hours.
                  </p>
                </div>
              </div>

              <Button className="mt-6 w-full" size="lg">
                Checkout ({groupedByFarmer.length} farmer{groupedByFarmer.length > 1 ? "s" : ""})
              </Button>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                You will approve {groupedByFarmer.length} transaction{groupedByFarmer.length > 1 ? "s" : ""} in your wallet
              </p>
            </div>
          </aside>
        </div>
      </Wrapper>
    </div>
  );
}
