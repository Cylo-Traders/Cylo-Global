"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { IOrder, OrderStatus } from "@/lib/types";

// ── Queries ──────────────────────────────────────────────────────────────────

/** The current user's orders (farmer sees orders received; buyer sees orders placed). */
export function useMyOrders(status?: OrderStatus) {
  const { authenticated, getAccessToken } = usePrivy();
  const params = status ? `?status=${status}` : "";

  return useQuery({
    queryKey: queryKeys.orders.mine(),
    queryFn: () => apiClient(getAccessToken).get<IOrder[]>(`/api/orders${params}`),
    enabled: authenticated,
  });
}

/** Single order — used for order detail / status polling. */
export function useOrder(id: string) {
  const { authenticated, getAccessToken } = usePrivy();

  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => apiClient(getAccessToken).get<IOrder>(`/api/orders/${id}`),
    enabled: authenticated && !!id,
  });
}

/**
 * Poll a specific order until it reaches a terminal status.
 * Useful after `wallet.transfer()` to watch confirmation on-chain.
 *
 * @param id - Order ID to watch
 * @param active - Pass `false` to stop polling (e.g. once confirmed)
 */
export function useOrderPolling(id: string, active: boolean) {
  const { authenticated, getAccessToken } = usePrivy();

  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => apiClient(getAccessToken).get<IOrder>(`/api/orders/${id}`),
    enabled: authenticated && !!id && active,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Stop polling once the order reaches a terminal state
      if (status === "completed" || status === "refunded") return false;
      return 5000; // poll every 5 s
    },
    staleTime: 0, // always re-fetch on interval
  });
}

/** All orders — admin only. */
export function useAdminOrders(status?: OrderStatus) {
  const { authenticated, getAccessToken } = usePrivy();
  const params = status ? `?status=${status}` : "";

  return useQuery({
    queryKey: queryKeys.orders.admin(),
    queryFn: () =>
      apiClient(getAccessToken).get<IOrder[]>(`/api/admin/orders${params}`),
    enabled: authenticated,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────

interface CreateOrderPayload {
  items: { productId: string; quantity: number }[];
  token: "USDC" | "STRK";
}

/** Place a new order (called after wallet.transfer() succeeds). */
export function useCreateOrder() {
  const { getAccessToken } = usePrivy();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderPayload) =>
      apiClient(getAccessToken).post<IOrder>("/api/orders", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.mine() });
    },
  });
}

/** Confirm an order after the on-chain tx is accepted. */
export function useConfirmOrder() {
  const { getAccessToken } = usePrivy();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, txHash }: { orderId: string; txHash: string }) =>
      apiClient(getAccessToken).post<IOrder>(`/api/orders/${orderId}/confirm`, {
        txHash,
      }),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.orders.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: queryKeys.orders.mine() });
      qc.invalidateQueries({ queryKey: queryKeys.earnings.all() });
    },
  });
}

/** Refund an order. */
export function useRefundOrder() {
  const { getAccessToken } = usePrivy();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) =>
      apiClient(getAccessToken).post<IOrder>(`/api/orders/${orderId}/refund`),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.orders.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: queryKeys.orders.mine() });
    },
  });
}

// Re-export so callers can import everything from one file
const earnings = queryKeys.earnings;
export { earnings };
