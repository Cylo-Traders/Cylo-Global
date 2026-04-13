"use client";

import { FaCartShopping } from "react-icons/fa6";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCartStore } from "@/lib/store/cart";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";

const CartSidebar = () => {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
    getTotalPrice,
  } = useCartStore();

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  return (
    <Sheet>
      <SheetTrigger className="relative cursor-pointer">
        <FaCartShopping className="size-5" />
        <span className="bg-destructive text-background absolute -top-3 -right-3 rounded-full px-[5px] text-[12px] font-semibold">
          {totalItems}
        </span>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
          <SheetDescription>
            Below is a list of item&apos;s you&apos;ve added to your cart.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col justify-between overflow-y-auto py-6">
          {items.length === 0 ? (
            <div className="mt-8 text-center">
              <FaCartShopping className="text-muted-foreground/25 mx-auto mb-4 size-12" />
              <p className="text-sm font-medium">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-lg border p-3">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={60}
                    height={60}
                    className="h-15 w-15 rounded object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{item.name}</h4>
                    <p className="font-semibold text-green-600">
                      ${item.price.toFixed(2)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="rounded bg-gray-100 px-2 py-1 text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="ml-auto text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <SheetFooter className="flex-col gap-2 sm:flex-col">
            <div className="flex w-full items-center justify-between text-lg font-semibold">
              <span>Total:</span>
              <span className="text-primary">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex w-full items-center gap-2">
              <Button className="flex-1">Checkout</Button>
              <Button variant="outline" className="w-max" onClick={clearCart}>
                Clear
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartSidebar;
