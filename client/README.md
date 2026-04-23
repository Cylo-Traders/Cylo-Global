# Cylo — Frontend Client

Peer-to-peer agro marketplace built on Starknet. Farmers list produce and receive on-chain payments directly from buyers — no middlemen, zero gas fees for users.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Auth | Privy (`@privy-io/react-auth`) — email + Google, embedded wallet management |
| Wallet / Starknet | Starkzap — onboarding, transfers, swaps, gas sponsorship |
| Gas Sponsorship | AVNU Paymaster (proxied via backend `/api/paymaster`) |
| Data Fetching | TanStack React Query |
| Tables | TanStack React Table |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI + shadcn/ui |
| State | Zustand (auth store, wallet store) |
| Charts | Recharts |
| Animations | GSAP + Lenis (smooth scroll) |
| Forms | React Hook Form + Zod |
| Toasts | Sonner |

## Project Structure

```
app/
  (root)/           # Public pages — home, market, about, onboarding, cart
  (dashboard)/      # Farmer dashboard — products, orders, earnings, settings
  (admin)/          # Admin panel — users, orders, products, analytics
  layout.tsx        # Root layout — GlobalProvider
  provider.tsx      # PrivyProvider > QueryProvider > Lenis > ThemeProvider

components/
  modals/           # AccountModal, WalletModal
  providers/        # privy-provider, query-provider
  shared/           # AuthGuard, ConnectWalletInner, DataTable, StatCard, PageHeader…
  ui/               # Base shadcn/ui primitives

hooks/
  use-wallet.ts     # Core Privy + Starkzap wallet hook
  queries/          # React Query domain hooks (profile, products, orders, earnings…)

lib/
  api.ts            # Typed fetch wrapper — auto-attaches Privy JWT
  starkzap.ts       # StarkZap SDK singleton
  query-client.ts   # React Query client (server singleton / browser singleton)
  query-keys.ts     # Centralised query key factory
  store/
    auth.ts         # Zustand — profile, isOnboarded (persisted)
    wallet.ts       # Zustand — wallet object, address, balances (in-memory)
  helpers/
    format-address.ts
    token.ts
  types/index.ts    # Shared TypeScript interfaces
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Install

```bash
pnpm install
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

```env
# Privy
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id

# Starknet
NEXT_PUBLIC_STARKNET_NETWORK=sepolia
# Leave NEXT_PUBLIC_STARKNET_RPC_URL unset — Starkzap uses Cartridge.gg by default

# AVNU Paymaster (public URL; API key lives server-side on the backend)
NEXT_PUBLIC_AVNU_PAYMASTER_URL=https://sepolia.paymaster.avnu.fi

# Backend base URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Run

```bash
pnpm dev      # development
pnpm build    # production build
pnpm start    # serve production build
```

## Auth & Wallet Flow

```
1. User clicks "Sign In"
      ↓
2. Privy modal — email or Google
      ↓
3. On first login → /onboarding (role + profile)
   On return login → /dashboard or /market
      ↓
4. useWallet hook fires automatically:
   POST /api/auth/signer-context  → get/create app-managed Starknet wallet
   sdk.onboard()                  → derive address, register AVNU swap provider
      ↓
5. Wallet ready — address known, transactions enabled
```

All Starknet transactions are gas-sponsored by AVNU. Users never pay network fees.

## Backend API

The frontend expects the following endpoints on `NEXT_PUBLIC_API_URL`:

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/signer-context` | Get or create app-managed Starknet wallet |
| POST | `/api/auth/sign` | Sign a transaction hash via Privy rawSign |
| POST | `/api/paymaster` | Proxy AVNU paymaster (keeps API key server-side) |
| POST | `/api/auth/register` | Create user profile after onboarding |
| GET | `/api/auth/me` | Fetch current user profile |
| PATCH | `/api/auth/profile` | Update profile |
| GET | `/api/products` | All product listings (public) |
| GET | `/api/products/my` | Farmer's own listings |
| POST | `/api/products` | Create product |
| PATCH | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/orders` | Current user's orders |
| POST | `/api/orders` | Place order |
| POST | `/api/orders/:id/confirm` | Confirm order after on-chain tx |
| POST | `/api/orders/:id/refund` | Refund order |
| GET | `/api/earnings/summary` | Farmer earnings summary |
| GET | `/api/earnings/payouts` | Payout history |
| GET | `/api/earnings/monthly` | Month-by-month chart data |
| GET | `/api/notifications` | User notifications |
| GET | `/api/dashboard/stats` | Farmer dashboard stats |
| GET | `/api/admin/users` | All users (admin) |
| GET | `/api/admin/orders` | All orders (admin) |
| GET | `/api/admin/products` | All products (admin) |
| GET | `/api/admin/stats` | Platform stats (admin) |

Every request (except `/api/paymaster`) requires `Authorization: Bearer <privy-jwt>`.

## Route Protection

- `/dashboard/*` — requires `authenticated + isOnboarded + role === "farmer"`
- `/admin/*` — requires `authenticated + isOnboarded`
- `/onboarding` — redirects away if already onboarded
- Unauthenticated users hitting protected routes are redirected to `/`

## Key Implementation Notes

- **App-managed wallets** — wallets are created server-side without `owner.user_id`. This allows the backend to sign transactions with the app secret alone, with no user token required at signing time.
- **No custom RPC** — `NEXT_PUBLIC_STARKNET_RPC_URL` is intentionally left unset. Starkzap defaults to Cartridge.gg which is far more reliable than free public RPCs.
- **OpenZeppelin account preset** — ArgentX (`argentXV050`) is incompatible with Starknet ≥ 0.13.5 due to the `l1_data_gas` field. All wallets use the OpenZeppelin preset.
- **deploy: 'never'** — wallets are not deployed during onboarding. `wallet.ensureReady({ deploy: 'if_needed', feeMode: 'sponsored' })` is called before every transaction instead.
- **Stale token prevention** — `getAccessToken()` is called fresh inside every `rawSign` invocation, never captured at connection time.
