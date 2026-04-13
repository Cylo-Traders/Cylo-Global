import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IProfile, UserRole } from "@/lib/types";

interface AuthStore {
  profile: IProfile | null;
  isOnboarded: boolean;
  setProfile: (profile: IProfile) => void;
  setOnboarded: (value: boolean) => void;
  clearAuth: () => void;
  getRole: () => UserRole | null;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      profile: null,
      isOnboarded: false,

      setProfile: (profile: IProfile) => {
        set({ profile, isOnboarded: true });
      },

      setOnboarded: (value: boolean) => {
        set({ isOnboarded: value });
      },

      clearAuth: () => {
        set({ profile: null, isOnboarded: false });
      },

      getRole: () => {
        return get().profile?.role ?? null;
      },
    }),
    {
      name: "cylo-auth",
    },
  ),
);
