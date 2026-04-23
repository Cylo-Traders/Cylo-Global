"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";
import type { ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  // getQueryClient() returns the browser singleton — stable across re-renders.
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
