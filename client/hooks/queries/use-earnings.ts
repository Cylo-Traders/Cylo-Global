"use client";

import { useQuery } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { IEarningsSummary, IMonthlyEarning, IPayout } from "@/lib/types";

/** Total / pending / fees / withdrawn summary for the farmer's earnings page. */
export function useEarningsSummary() {
  const { authenticated, getAccessToken } = usePrivy();

  return useQuery({
    queryKey: queryKeys.earnings.summary(),
    queryFn: () =>
      apiClient(getAccessToken).get<IEarningsSummary>("/api/earnings/summary"),
    enabled: authenticated,
  });
}

/** Month-by-month gross vs net data for the earnings line chart. */
export function useMonthlyEarnings() {
  const { authenticated, getAccessToken } = usePrivy();

  return useQuery({
    queryKey: queryKeys.earnings.monthly(),
    queryFn: () =>
      apiClient(getAccessToken).get<IMonthlyEarning[]>("/api/earnings/monthly"),
    enabled: authenticated,
    // Chart data doesn't change often — keep it fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
}

/** Paginated payout history for the earnings table. */
export function usePayouts() {
  const { authenticated, getAccessToken } = usePrivy();

  return useQuery({
    queryKey: queryKeys.earnings.payouts(),
    queryFn: () =>
      apiClient(getAccessToken).get<IPayout[]>("/api/earnings/payouts"),
    enabled: authenticated,
  });
}
