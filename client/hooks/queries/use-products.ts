"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { IProduct } from "@/lib/types";

// ── Queries ──────────────────────────────────────────────────────────────────

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: "USDC" | "STRK";
}

/** All available products — public, used on /market. */
export function useProducts(filters?: ProductFilters) {
  const { getAccessToken } = usePrivy();
  const params = filters
    ? "?" + new URLSearchParams(
        Object.entries(filters)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : "";

  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: () => apiClient(getAccessToken).get<IProduct[]>(`/api/products${params}`),
  });
}

/** The authenticated farmer's own product listings. */
export function useMyProducts() {
  const { authenticated, getAccessToken } = usePrivy();

  return useQuery({
    queryKey: queryKeys.products.mine(),
    queryFn: () => apiClient(getAccessToken).get<IProduct[]>("/api/products/my"),
    enabled: authenticated,
  });
}

/** Products listed by a specific farmer — used on /market/[wallet]. */
export function useFarmerProducts(wallet: string) {
  const { getAccessToken } = usePrivy();

  return useQuery({
    queryKey: queryKeys.products.byFarmer(wallet),
    queryFn: () =>
      apiClient(getAccessToken).get<IProduct[]>(`/api/products/farmer/${wallet}`),
    enabled: !!wallet,
  });
}

/** Single product detail. */
export function useProduct(id: string) {
  const { getAccessToken } = usePrivy();

  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => apiClient(getAccessToken).get<IProduct>(`/api/products/${id}`),
    enabled: !!id,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────

interface ProductPayload {
  name: string;
  image: string;
  price: number;
  unit: string;
  category: string;
  stockQuantity: number;
  currency: "USDC" | "STRK";
  isAvailable?: boolean;
}

/** Create a new product listing. */
export function useCreateProduct() {
  const { getAccessToken } = usePrivy();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProductPayload) =>
      apiClient(getAccessToken).post<IProduct>("/api/products", payload),
    onSuccess: () => {
      // Invalidate both the public list and the farmer's own list
      qc.invalidateQueries({ queryKey: queryKeys.products.all() });
    },
  });
}

/** Update an existing product. */
export function useUpdateProduct() {
  const { getAccessToken } = usePrivy();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<ProductPayload> & { id: string }) =>
      apiClient(getAccessToken).patch<IProduct>(`/api/products/${id}`, payload),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.products.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: queryKeys.products.mine() });
      qc.invalidateQueries({ queryKey: queryKeys.products.all() });
    },
  });
}

/** Delete a product. */
export function useDeleteProduct() {
  const { getAccessToken } = usePrivy();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient(getAccessToken).del<void>(`/api/products/${id}`),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: queryKeys.products.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.products.mine() });
      qc.invalidateQueries({ queryKey: queryKeys.products.all() });
    },
  });
}
