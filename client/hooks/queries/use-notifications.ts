"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { INotification } from "@/lib/types";

/** All notifications for the current user. Polls every 30 s when the tab is active. */
export function useNotifications() {
  const { authenticated, getAccessToken } = usePrivy();

  return useQuery({
    queryKey: queryKeys.notifications.all(),
    queryFn: () =>
      apiClient(getAccessToken).get<INotification[]>("/api/notifications"),
    enabled: authenticated,
    refetchInterval: 30 * 1000,
    staleTime: 0,
  });
}

/** Mark a single notification as read. */
export function useMarkNotificationRead() {
  const { getAccessToken } = usePrivy();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient(getAccessToken).patch<INotification>(`/api/notifications/${id}/read`),
    onSuccess: (updated) => {
      // Optimistically update the cached list in place
      qc.setQueryData<INotification[]>(
        queryKeys.notifications.all(),
        (prev) =>
          prev?.map((n) => (n.id === updated.id ? updated : n)) ?? [],
      );
    },
  });
}

/** Mark all notifications as read. */
export function useMarkAllNotificationsRead() {
  const { getAccessToken } = usePrivy();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiClient(getAccessToken).post<void>("/api/notifications/read-all"),
    onSuccess: () => {
      qc.setQueryData<INotification[]>(
        queryKeys.notifications.all(),
        (prev) => prev?.map((n) => ({ ...n, read: true })) ?? [],
      );
    },
  });
}
