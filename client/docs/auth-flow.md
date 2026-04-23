# Cylo — Auth, Wallet & Communication Spec
## Privy × Starkzap × Smart Contracts

> **For the backend dev:** Jump to [Backend Responsibilities](#backend-responsibilities) and
> [API Contract](#api-contract). The rest is context.

---

## About the "Nonce" Question

**There is no nonce in this flow.** Here is why:

| Nonce type | Used? | Who handles it |
|------------|-------|---------------|
| **SIWS auth nonce** (old flow) | ❌ Not used | Privy replaces this entirely |
| **API request nonce** | ❌ Not needed | Privy JWT is the auth layer |
| **Starknet tx nonce** (account counter) | ✅ Used internally | Starkzap handles it automatically |

The backend dev does **not** need to generate, store, or send any nonce. Privy's access token is the
authentication mechanism. The backend verifies it on every request with `verifyAuthToken(token)`.
Starknet's per-account transaction nonce (which prevents replay attacks on-chain) is managed
automatically by the Starkzap SDK — it queries the RPC node before each transaction.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                  CYLO PLATFORM                                   │
│                                                                                  │
│   ┌──────────────────┐      ┌──────────────────┐      ┌────────────────────┐    │
│   │  Next.js Client  │      │  Express Backend  │      │  Cairo Contracts   │    │
│   │  (client/)       │      │  (api/)           │      │  (contracts/)      │    │
│   └────────┬─────────┘      └────────┬──────────┘      └────────┬───────────┘   │
│            │                         │                           │               │
│            │  3 auth endpoints only  │                           │               │
│            │──────────────────────►  │                           │               │
│            │                         │  verifyAuthToken          │               │
│            │                         │──────────────► Privy      │               │
│            │                         │                           │               │
│            │                         │  rawSign(walletId, hash)  │               │
│            │                         │──────────────► Privy      │               │
│            │  { signature }          │                           │               │
│            │ ◄──────────────────────  │                           │               │
│            │                         │                           │               │
│  Starkzap broadcasts tx ─────────────────────────────────────────────────────►  │
│  (signed by Privy via backend)        │                           On-chain tx    │
│            │                         │                           confirmed       │
│            │  notify backend         │                           │               │
│            │──────────────────────►  │                           │               │
│            │  { txHash, orderId }    │  DB records order state   │               │
│            │                         │ ◄─────── event listener   │               │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Rule:** The Starkzap SDK (frontend) is the only thing that talks to Starknet RPC directly.
The backend never broadcasts transactions — it only signs via Privy when Starkzap requests it.

---

## Packages

### Frontend (`client/`)
```bash
pnpm add @privy-io/react-auth   # auth UI + getAccessToken
pnpm add starkzap               # Starknet wallet, payments, swaps
```

### Backend (`api/`)
```bash
pnpm add @privy-io/server-auth  # verifyAuthToken
pnpm add @privy-io/node         # wallets().create() + wallets().rawSign()
```

> **Why two `@privy-io` packages on the backend?**
> They are separate SDKs. `server-auth` is for token verification only.
> `node` is the wallet operations SDK — it's the one with `rawSign()`.

---

## Critical Decisions (do not deviate)

### 1. App-Managed Wallets — No `owner.user_id`

```typescript
// ✅ CORRECT — app-managed, signs with app secret, no user token needed
const wallet = await privyNodeClient.wallets().create({ chain_type: 'starknet' })

// ❌ WRONG — user-owned, requires user's identity token on every rawSign
const wallet = await privyNodeClient.wallets().create({
  chain_type: 'starknet',
  owner: { user_id: 'privy-user-xxx' }  // DO NOT do this
})
```

Why: User-owned wallets require `authorization_context: { user_jwts: [identityToken] }` in every
`rawSign` call. Identity tokens only exist when the user has an open Privy modal — they are `null`
at signing time. This breaks every transaction. App-managed wallets authenticate with the app
secret alone.

### 2. OpenZeppelin Account Preset — Not ArgentX

```typescript
// ✅ CORRECT
accountPreset: 'openzeppelin'

// ❌ WRONG — ArgentX compiled before Starknet 0.13.5 l1_data_gas field
// Causes: __validate__ panicked: 'Out of gas' on every tx
accountPreset: accountPresets.argentXV050
```

### 3. `deploy: 'never'` in `sdk.onboard()` + `deployIfNeeded()` Before Each Tx

```typescript
// ✅ CORRECT — never auto-deploy during onboard (wallet balance is 0)
sdk.onboard({ ..., deploy: 'never' })

// Call this before every transaction (idempotent):
await wallet.ensureReady({ deploy: 'if_needed', feeMode: 'sponsored' })

// ❌ WRONG — deploy: 'if_needed' on empty wallet fails immediately
// Error: "Resources bounds (...) exceed balance (0)"
sdk.onboard({ ..., deploy: 'if_needed' })
```

### 4. `rawSign` with Fresh Token Per Call — Not `serverUrl`

```typescript
// ✅ CORRECT — getAccessToken() called fresh inside rawSign
rawSign: async (wId, hash) => {
  const freshToken = await getAccessToken()   // re-fetches, handles expiry
  const res = await fetch('/api/auth/sign', { ... })
  return res.signature
}

// ❌ WRONG — captured token will expire during a long session
const capturedToken = await getAccessToken()
rawSign: async (wId, hash) => {
  // uses stale token → "Sign relay error: 400"
  const res = await fetch('/api/auth/sign', { headers: { Authorization: capturedToken } })
}
```

### 5. AVNU Paymaster — Always Proxied Server-Side

Never put `AVNU_PAYMASTER_API_KEY` in a `NEXT_PUBLIC_` variable. The Starkzap SDK's
`paymaster.nodeUrl` must point to your own `/api/paymaster` route which injects the key.

### 6. Use Starkzap's Built-In RPC — Do Not Set a Custom One

Leave `NEXT_PUBLIC_STARKNET_RPC_URL` unset. Starkzap defaults to Cartridge.gg's endpoint
(`https://api.cartridge.gg/x/starknet/sepolia`). Free RPCs (Alchemy, Blast, Infura) return
`-32001: Unable to complete request` errors under load.

### 7. tsconfig Must Target ES2020+

```json
{ "compilerOptions": { "target": "ES2020" } }
```

Starknet.js and Starkzap use BigInt extensively. TypeScript rejects BigInt syntax below ES2020.
Use `BigInt(0)` (function call) instead of `0n` (literal) in your own code — the literal form
requires ES2020 at the syntax level too.

---

## Backend Responsibilities

The backend has **exactly three auth/wallet endpoints** to build, plus business endpoints.

### Auth/Wallet Endpoints (required for wallet to work)

#### `POST /api/auth/signer-context`
Called once when the user connects their wallet. Returns the wallet ID and public key for
Starkzap to use when building transactions.

```typescript
// Request: Authorization: Bearer <privy-access-token>
// Response: { walletId: string, publicKey: string }

import { PrivyClient } from '@privy-io/server-auth'
import { PrivyClient as PrivyNodeClient } from '@privy-io/node'

const privyAuth = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET)
const privyNode = new PrivyNodeClient({ appId: PRIVY_APP_ID, appSecret: PRIVY_APP_SECRET })

app.post('/api/auth/signer-context', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  // Verify the Privy JWT
  const { userId: privyUserId } = await privyAuth.verifyAuthToken(token)

  // Look up user in DB
  const user = await db.users.findOne({ privyUserId })
  if (!user) {
    // First login — create user record
    // (or create here: depends on your onboarding flow)
    return res.status(404).json({ error: 'User not found' })
  }

  let { privyWalletId: walletId } = user
  let publicKey: string | undefined

  if (walletId) {
    // Wallet exists — fetch its public key
    const wallet = await privyNode.wallets().get(walletId)
    publicKey = wallet.public_key
  }

  if (!walletId || !publicKey) {
    // First time — create an app-managed Starknet wallet
    // NO owner.user_id — this is critical (see decision #1 above)
    const wallet = await privyNode.wallets().create({ chain_type: 'starknet' })
    walletId = wallet.id
    publicKey = wallet.public_key

    // Persist wallet ID and Starknet address to DB
    await db.users.update({ privyUserId }, {
      privyWalletId: walletId,
      starknetAddress: wallet.address,
    })
  }

  return res.json({ walletId, publicKey })
})
```

#### `POST /api/auth/sign`
Called by Starkzap every time it needs to sign a transaction hash. Called for every
transaction: account deployment, escrow creation, payment release, swap, etc.

```typescript
// Request: Authorization: Bearer <privy-access-token>
//          Body: { walletId: string, hash: string }  — hash is a hex string
// Response: { signature: string }

app.post('/api/auth/sign', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  // Always verify auth before signing — this is the security gate
  await privyAuth.verifyAuthToken(token)

  const { walletId, hash } = req.body
  if (!walletId || !hash) return res.status(400).json({ error: 'Missing walletId or hash' })

  // App-managed wallet — no authorization_context needed
  const result = await privyNode.wallets().rawSign(walletId, { params: { hash } })

  return res.json({ signature: result.signature })
})
```

#### `POST /api/paymaster` — AVNU Proxy
Proxies requests to AVNU Paymaster so the API key stays server-side.

```typescript
// Request: same body as what Starkzap would send to AVNU
// Response: AVNU's response, forwarded as-is

const AVNU_URL = 'https://sepolia.paymaster.avnu.fi'  // or mainnet URL

app.post('/api/paymaster', async (req, res) => {
  const upstream = await fetch(AVNU_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-paymaster-api-key': process.env.AVNU_PAYMASTER_API_KEY!,
    },
    body: JSON.stringify(req.body),
  })
  const data = await upstream.json()
  return res.status(upstream.status).json(data)
})
```

---

## Database Schema (minimum required fields)

```typescript
// users table — minimum columns for wallet association
{
  id:              string,   // internal ID
  privyUserId:     string,   // "did:privy:xxx" — from verifyAuthToken
  privyWalletId:   string,   // "wallet_xxx" — Privy wallet UUID, persist to reuse across sessions
  starknetAddress: string,   // "0x..." — derived from publicKey, used on-chain
  role:            'farmer' | 'buyer',
  // ... other user fields
}
```

**Why persist `privyWalletId`?** Without it, you'd call `privyNode.wallets().create()` on every
session, creating a new wallet each time. The user's address would change. Store it after first
creation and reuse it.

---

## Frontend Setup

### `lib/starkzap.ts`
```typescript
import { StarkZap } from 'starkzap'

export const sdk = new StarkZap({
  network: (process.env.NEXT_PUBLIC_STARKNET_NETWORK || 'sepolia') as 'sepolia' | 'mainnet',
  // No rpcUrl — use Starkzap's built-in Cartridge.gg endpoint
  paymaster: {
    nodeUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/paymaster`,
  },
})
```

### `lib/privy.ts` (backend)
```typescript
import { PrivyClient } from '@privy-io/server-auth'
import { PrivyClient as PrivyNodeClient } from '@privy-io/node'

export const privyAuth = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
)

export const privyNode = new PrivyNodeClient({
  appId:     process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
})
```

### `hooks/use-wallet.ts` (full implementation)

```typescript
'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { OnboardStrategy, AvnuSwapProvider } from 'starkzap'
import { sdk } from '@/lib/starkzap'

export function useWallet() {
  const { authenticated, getAccessToken, login, logout: privyLogout } = usePrivy()
  const [wallet, setWallet] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const connectingRef = useRef(false)
  const attemptedRef  = useRef(false)

  const connectWallet = useCallback(async () => {
    if (!authenticated || wallet || connectingRef.current) return
    connectingRef.current = true
    setConnecting(true)
    try {
      const accessToken = await getAccessToken()

      const { wallet: starkWallet } = await sdk.onboard({
        strategy: OnboardStrategy.Privy,
        accountPreset: 'openzeppelin',    // ArgentX broken on Starknet ≥0.13.5
        feeMode: 'sponsored',              // AVNU pays all gas
        deploy: 'never',                   // never auto-deploy; call deployIfNeeded() before each tx
        privy: {
          resolve: async () => {
            // Get wallet context from backend
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signer-context`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}` },
            })
            const { walletId, publicKey } = await res.json()

            return {
              walletId,
              publicKey,
              // rawSign is called for EVERY transaction
              rawSign: async (wId: string, hash: string) => {
                const freshToken = await getAccessToken()  // always fresh — prevents expiry errors
                const signRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/sign`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${freshToken}`,
                  },
                  body: JSON.stringify({ walletId: wId, hash }),
                })
                const { signature } = await signRes.json()
                return signature
              },
            }
          },
        },
      })

      // Patch starknet.js v9 BigInt/Number coercion bug
      const account = starkWallet.getAccount() as unknown as Record<string, unknown>
      if (account && typeof account.resolveDetailsWithTip === 'function') {
        const orig = (account.resolveDetailsWithTip as (...a: unknown[]) => Promise<Record<string, unknown>>).bind(account)
        account.resolveDetailsWithTip = async (details: Record<string, unknown>) => {
          const resolved = await orig(details)
          const rb = resolved.resourceBounds as Record<string, Record<string, unknown>> | undefined
          if (rb?.l1_gas && (rb.l1_gas.max_amount === '0x0' || rb.l1_gas.max_amount === BigInt(0) || rb.l1_gas.max_amount === 0)) {
            rb.l1_gas = { ...rb.l1_gas, max_amount: '0x1000' }
          }
          return { ...resolved, tip: BigInt(0), resourceBounds: rb ?? resolved.resourceBounds }
        }
      }

      // Register swap provider (needed for wallet.swap() and wallet.getQuote())
      starkWallet.registerSwapProvider(new AvnuSwapProvider(), true)

      setWallet(starkWallet)
    } finally {
      setConnecting(false)
      connectingRef.current = false
    }
  }, [authenticated, wallet, getAccessToken])

  // Auto-connect after Privy login
  useEffect(() => {
    if (!authenticated || wallet || attemptedRef.current) return
    attemptedRef.current = true
    connectWallet()
  }, [authenticated, wallet, connectWallet])

  // Call before EVERY transaction (idempotent — safe to call even if already deployed)
  const deployIfNeeded = useCallback(async () => {
    if (!wallet) throw new Error('Wallet not connected')
    await wallet.ensureReady({ deploy: 'if_needed', feeMode: 'sponsored' })
  }, [wallet])

  const logout = useCallback(async () => {
    attemptedRef.current = false
    connectingRef.current = false
    setWallet(null)
    await privyLogout()
  }, [privyLogout])

  return { wallet, connecting, login, logout, deployIfNeeded }
}
```

---

## Transaction Flow (Escrow Order Example)

This is how a buyer purchasing from a farmer works end-to-end:

```
Buyer action: "Place Order" button clicked
      │
      ▼
1. deployIfNeeded()
   └─ wallet.ensureReady({ deploy: 'if_needed', feeMode: 'sponsored' })
   └─ If account not yet on Starknet: broadcasts DEPLOY_ACCOUNT tx
   └─ AVNU sponsors the deployment gas
   └─ Starkzap handles the Starknet account nonce automatically
      │
      ▼
2. wallet.transfer(USDC, [{ to: CYLO_ESCROW_CONTRACT, amount }])
   └─ Starkzap builds the V3 transaction
   └─ Calls rawSign(walletId, hash) → POST /api/auth/sign → Privy signs
   └─ Broadcasts signed tx to Starknet via Cartridge.gg RPC
      │
      ▼
3. Save txHash immediately (double-charge guard)
   setPendingTxHash(tx.hash)
      │
      ▼
4. tx.watch({ pollIntervalMs: 5000, timeoutMs: 180000 })
   └─ Ignore "not found" errors in onError — RPC node may not have indexed yet
   └─ Resolve when finality === 'ACCEPTED_ON_L2'
      │
      ▼
5. Notify backend: POST /api/orders
   Body: { txHash, productId, farmerId, amount, buyerAddress }
   └─ Backend records the order in DB
   └─ Backend optionally listens to on-chain events to auto-verify
      │
      ▼
6. Order confirmed on-chain. Funds locked in escrow contract.

─── Buyer confirms receipt ──────────────────────────────────────────────

7. deployIfNeeded()  (same idempotent check)
      │
      ▼
8. wallet.execute(ESCROW_CONTRACT, 'confirm_receipt', [orderId])
   └─ Same rawSign → /api/auth/sign → Privy pattern
   └─ Contract releases funds to farmer
      │
      ▼
9. POST /api/orders/:id/confirm
   Body: { txHash }
   └─ Backend marks order complete in DB
```

---

## Handling Retries (Double-Charge Prevention)

```typescript
// In your purchase handler:
const tx = await wallet.transfer(USDC, transfers)

// CRITICAL: save hash before anything else — transfer is already on-chain
const txHash = String(tx.hash)
setPendingTxHash(txHash)

// Now watch + confirm. If this throws, retry reads pendingTxHash
// and skips directly to confirmOrder — never re-transfers.
await tx.watch(...)
await notifyBackend({ txHash, orderId })

setPendingTxHash(null)  // clear on full success

// Retry logic:
const retry = () => {
  if (pendingTxHash) {
    retryConfirmation(pendingTxHash, orderId)  // payment already done
  } else {
    startPurchase(productId)  // safe to restart from scratch
  }
}
```

---

## Google Login Redirect Handling

Google OAuth redirects the page — all React state is lost. Store intent in `sessionStorage`
before calling `login()`:

```typescript
// Before Privy login
sessionStorage.setItem('pendingOrderProductId', productId)
login()

// After login (useEffect watching isAuthenticated + wallet)
useEffect(() => {
  if (!authenticated || !wallet) return
  const productId = sessionStorage.getItem('pendingOrderProductId')
  if (!productId) return
  sessionStorage.removeItem('pendingOrderProductId')
  startPurchase(productId)
}, [authenticated, wallet])
```

---

## Environment Variables

### Frontend (`client/.env.local`)
```bash
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
NEXT_PUBLIC_STARKNET_NETWORK=sepolia         # or mainnet
NEXT_PUBLIC_API_URL=http://localhost:3001    # backend base URL
# NEXT_PUBLIC_STARKNET_RPC_URL=             # leave unset — use Starkzap's Cartridge.gg default
```

### Backend (`api/.env`)
```bash
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id  # same app ID
PRIVY_APP_SECRET=your-privy-app-secret
AVNU_PAYMASTER_API_KEY=your-avnu-api-key    # from portal.avnu.fi
```

---

## Error Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `No valid authorization keys` | App wallet signed as user-owned | Remove `owner.user_id` from `wallets().create()` |
| `Invalid JWT token provided` | Access token used as identity token | Use app-managed wallets — no `authorization_context` |
| `Resources bounds exceed balance (0)` | `deploy: 'if_needed'` on empty wallet | Use `deploy: 'never'` + `deployIfNeeded()` before each tx |
| `Cannot mix BigInt and other types` | starknet.js v9 tip coercion bug | Apply `resolveDetailsWithTip` patch + use `openzeppelin` preset |
| `__validate__ panicked: Out of gas` | ArgentX class hash incompatible with Starknet ≥0.13.5 | Use `accountPreset: 'openzeppelin'` |
| `RPC -32001: Unable to complete request` | Unreliable third-party RPC | Remove `NEXT_PUBLIC_STARKNET_RPC_URL` — use Cartridge.gg |
| `Transaction hash not found` (in tx.watch) | RPC hasn't indexed tx yet — transient | Ignore in `onError` if message contains "not found"; keep polling |
| `Sign relay error: 400` | Stale access token in rawSign closure | Call `getAccessToken()` fresh inside rawSign each time |
| Buyer charged twice on retry | tx confirmed but confirmation call failed | Save `txHash` immediately after `wallet.transfer()`; retry skips transfer |
| `BigInt literals not available` | tsconfig target < ES2020 | Set `"target": "ES2020"` in `tsconfig.json` |

---

## Backend API Summary (what frontend will call)

### Auth / Wallet (required for Starkzap to work)
| Method | Endpoint | Called by | Purpose |
|--------|----------|-----------|---------|
| `POST` | `/api/auth/signer-context` | `sdk.onboard()` | Get/create Privy wallet |
| `POST` | `/api/auth/sign` | Every tx (rawSign) | Sign tx hash via Privy |
| `POST` | `/api/paymaster` | Starkzap internally | Proxy AVNU API key |

### Business (Cylo-specific — frontend calls after tx confirmed)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/auth/register` | Create user record on first login |
| `GET` | `/api/users/me` | Fetch current user profile + wallet address |
| `GET` | `/api/products` | List marketplace products |
| `POST` | `/api/products` | Farmer creates product listing |
| `POST` | `/api/orders` | Record order after on-chain tx confirmed |
| `GET` | `/api/orders` | List user's orders |
| `POST` | `/api/orders/:id/confirm` | Buyer confirms receipt (after on-chain confirm tx) |

---

## Flow Summary (share this with backend dev)

```
USER LOGS IN
  1. Privy modal → Google / email / wallet
  2. Privy issues access token (JWT)
  3. Frontend: POST /api/auth/signer-context (Bearer token)
     Backend: verifyAuthToken → create/get app-managed Starknet wallet
     Returns: { walletId, publicKey }
  4. sdk.onboard(OnboardStrategy.Privy, accountPreset: 'openzeppelin', deploy: 'never')
     → Starknet address derived from publicKey (no tx yet)
  5. Wallet ready — user can see their balance

BUYER PLACES ORDER
  6. deployIfNeeded() — deploys OZ account if first time (AVNU pays gas)
  7. wallet.transfer(USDC, escrow_contract, amount)
     → Starkzap calls rawSign(walletId, hash)
     → POST /api/auth/sign → Privy signs → signature returned
     → Signed tx broadcast to Starknet (Cartridge.gg RPC)
  8. txHash saved immediately (double-charge guard)
  9. tx.watch() → polls until ACCEPTED_ON_L2
 10. POST /api/orders { txHash, productId, amount } → backend records order

BUYER CONFIRMS RECEIPT
 11. deployIfNeeded() (idempotent)
 12. wallet.execute(escrow_contract, 'confirm_receipt', [orderId])
     → same rawSign → /api/auth/sign → Privy → Starknet
 13. POST /api/orders/:id/confirm { txHash } → backend marks complete
 14. Farmer's wallet receives payment on-chain
```

---

## Key Resources

| Resource | URL |
|----------|-----|
| Starkzap overview | https://docs.starknet.io/build/starkzap/overview |
| Starkzap Privy integration | https://docs.starknet.io/build/starkzap/integrations/privy |
| Starkzap AVNU paymaster | https://docs.starknet.io/build/starkzap/integrations/avnu-paymaster |
| Starkzap GitHub | https://github.com/keep-starknet-strange/starkzap |
| Privy React Auth | https://docs.privy.io/reference/react-auth |
| Privy Node SDK | https://docs.privy.io/reference/server-sdk-node |
| AVNU portal (API key) | https://portal.avnu.fi |
| Privy dashboard | https://dashboard.privy.io |
