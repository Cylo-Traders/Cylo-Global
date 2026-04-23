"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/lib/store/auth";
import type { IProfile, UserRole } from "@/lib/types";

// ── Queries ──────────────────────────────────────────────────────────────────

/** Fetch the authenticated user's profile from the backend. */
export function useProfile() {
  const { authenticated, getAccessToken } = usePrivy();

  return useQuery({
    queryKey: queryKeys.profile.me(),
    queryFn: () => apiClient(getAccessToken).get<IProfile>("/api/auth/me"),
    enabled: authenticated,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────

interface RegisterPayload {
  role: UserRole;
  displayName: string;
  bio?: string;
  city?: string;
  country?: string;
}

/** Register a new user profile (called at the end of onboarding step 3). */
export function useRegister() {
  const { getAccessToken } = usePrivy();
  const { setProfile } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterPayload) =>
      apiClient(getAccessToken).post<IProfile>("/api/auth/register", payload),
    onSuccess: (profile) => {
      // Sync to Zustand so AuthGuard + ConnectWalletInner pick it up immediately
      setProfile(profile);
      // Seed the query cache so useProfile() resolves without a round-trip
      qc.setQueryData(queryKeys.profile.me(), profile);
    },
  });
}

interface UpdateProfilePayload {
  displayName?: string;
  bio?: string;
  city?: string;
  country?: string;
  avatar?: string;
}

/** Update the authenticated user's profile. */
export function useUpdateProfile() {
  const { getAccessToken } = usePrivy();
  const { setProfile } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      apiClient(getAccessToken).patch<IProfile>("/api/auth/profile", payload),
    onSuccess: (profile) => {
      setProfile(profile);
      qc.setQueryData(queryKeys.profile.me(), profile);
    },
  });
}
