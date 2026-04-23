"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { IAdminUser, IAdminStats, IOrder, IProduct } from "@/lib/types";

// ── Queries ──────────────────────────────────────────────────────────────────

/** Platform-wide stats for the admin overview page. */
export function useAdminStats() {
  const { authenticated, getAccessToken } = usePrivy();

  return useQuery({
    queryKey: queryKeys.admin.stats(),
    queryFn: () =>
      apiClient(getAccessToken).get<IAdminStats>("/api/admin/stats"),
    enabled: authenticated,
    staleTime: 2 * 60 * 1000,
  });
}

/** All users across the platform — admin only. */
export function useAdminUsers() {
  const { authenticated, getAccessToken } = usePrivy();

  return useQuery({
    queryKey: queryKeys.admin.users(),
    queryFn: () =>
      apiClient(getAccessToken).get<IAdminUser[]>("/api/admin/users"),
    enabled: authenticated,
  });
}

/** All orders across the platform — admin only. */
export function useAllOrders() {
  const { authenticated, getAccessToken } = usePrivy();

  return useQuery({
    queryKey: queryKeys.orders.admin(),
    queryFn: () =>
      apiClient(getAccessToken).get<IOrder[]>("/api/admin/orders"),
    enabled: authenticated,
  });
}

/** All product listings across the platform — admin only. */
export function useAllProducts() {
  const { authenticated, getAccessToken } = usePrivy();

  return useQuery({
    queryKey: queryKeys.products.list(),
    queryFn: () =>
      apiClient(getAccessToken).get<IProduct[]>("/api/admin/products"),
    enabled: authenticated,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────

/** Suspend or reinstate a user. */
export function useUpdateUserStatus() {
  const { getAccessToken } = usePrivy();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      wallet,
      status,
    }: {
      wallet: string;
      status: "active" | "suspended";
    }) =>
      apiClient(getAccessToken).patch<IAdminUser>(
        `/api/admin/users/${wallet}/status`,
        { status },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.users() });
    },
  });
}

/** Remove a product listing (admin override). */
export function useAdminDeleteProduct() {
  const { getAccessToken } = usePrivy();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient(getAccessToken).del<void>(`/api/admin/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all() });
    },
  });
}

// Make queryKeys.orders available inside this file without a separate import
const { orders } = queryKeys;
export { orders };
