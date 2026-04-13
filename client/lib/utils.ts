import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(currency: number) {
  const amount = currency / 1e18;
  return amount || 0;
}

export function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function getInitials(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  const initials = parts.map((part) => part[0].toUpperCase()).slice(0, 2);
  return initials.join("");
}

export const categories = [
  { label: "All Categories", value: "all" },
  { label: "Fruits", value: "fruits" },
  { label: "Vegetables", value: "vegetables" },
  { label: "Grains", value: "grains" },
  { label: "Dairy", value: "dairy" },
  { label: "Meat", value: "meat" },
  { label: "Beverages", value: "beverages" },
  { label: "Oils", value: "oils" },
  { label: "Sweeteners", value: "sweeteners" },
];
