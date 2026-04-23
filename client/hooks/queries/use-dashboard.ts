"use client";

import { useQuery } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { IDashboardStats } from "@/lib/types";

/**
 * Farmer dashboard overview — stats, chart data, and recent orders in one call.
 * Stale after 2 minutes so it stays reasonably fresh without hammering the backend.
 */
export function useDashboardStats() {
  const { authenticated, getAccessToken } = usePrivy();

  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () =>
      apiClient(getAccessToken).get<IDashboardStats>("/api/dashboard/stats"),
    enabled: authenticated,
    staleTime: 2 * 60 * 1000,
  });
}
