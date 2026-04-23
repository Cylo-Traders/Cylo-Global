/**
 * Centralised query key factory.
 *
 * Rules:
 * - Every key is an array (React Query standard).
 * - Broader keys are prefixes of narrower ones — so invalidating
 *   `queryKeys.products.all()` also invalidates `queryKeys.products.list()`
 *   and `queryKeys.products.mine()`, etc.
 */

export const queryKeys = {
  // ── Profile ────────────────────────────────────────────────────────────────
  profile: {
    all: () => ["profile"] as const,
    me: () => ["profile", "me"] as const,
  },

  // ── Products ────────────────────────────────────────────────────────────────
  products: {
    all: () => ["products"] as const,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    list: (filters?: any) => ["products", "list", filters ?? {}] as const,
    mine: () => ["products", "mine"] as const,
    byFarmer: (wallet: string) => ["products", "farmer", wallet] as const,
    detail: (id: string) => ["products", "detail", id] as const,
  },

  // ── Orders ──────────────────────────────────────────────────────────────────
  orders: {
    all: () => ["orders"] as const,
    mine: () => ["orders", "mine"] as const,
    admin: () => ["orders", "admin"] as const,
    detail: (id: string) => ["orders", "detail", id] as const,
  },

  // ── Earnings ────────────────────────────────────────────────────────────────
  earnings: {
    all: () => ["earnings"] as const,
    summary: () => ["earnings", "summary"] as const,
    payouts: () => ["earnings", "payouts"] as const,
    monthly: () => ["earnings", "monthly"] as const,
  },

  // ── Notifications ───────────────────────────────────────────────────────────
  notifications: {
    all: () => ["notifications"] as const,
  },

  // ── Admin ───────────────────────────────────────────────────────────────────
  admin: {
    all: () => ["admin"] as const,
    users: () => ["admin", "users"] as const,
    stats: () => ["admin", "stats"] as const,
  },
} as const;
