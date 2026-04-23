"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthStore } from "@/lib/store/auth";
import type { ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
  /** "farmer" or "buyer" — if set, also checks the user's role */
  requiredRole?: "farmer" | "buyer" | "admin";
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { authenticated, ready } = usePrivy();
  const { isOnboarded, getRole } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;

    if (!authenticated) {
      router.replace("/");
      return;
    }

    if (authenticated && !isOnboarded) {
      router.replace("/onboarding");
      return;
    }

    if (requiredRole && getRole() !== requiredRole) {
      // Wrong role — send farmers to dashboard, buyers to market
      const role = getRole();
      router.replace(role === "farmer" ? "/dashboard" : "/market");
    }
  }, [ready, authenticated, isOnboarded, requiredRole, router, getRole]);

  // Show nothing while Privy is initialising or a redirect is in progress
  if (!ready || !authenticated || !isOnboarded) {
    return null;
  }

  if (requiredRole && getRole() !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
