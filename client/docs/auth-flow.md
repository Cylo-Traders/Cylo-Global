# Cylo — Sign-In With Starknet (SIWS) Auth Flow

## What is Starkzap?

**Starkzap** ([starkzap.io](https://starkzap.io) · [docs](https://docs.starknet.io/build/starkzap/overview) · [GitHub](https://github.com/keep-starknet-strange/starkzap)) is a TypeScript SDK for building consumer applications on Starknet. It abstracts the complexity of:

- Wallet and account management (no seed phrases)
- Social login via Privy and Cartridge (Google, Apple, Passkeys)
- Gasless transactions (AVNU, Cartridge paymasters)
- DeFi: token swaps, staking, lending, bridging, confidential transfers
- Cross-platform: web, React Native, iOS/Android, Node.js

Starkzap is **not** a SIWS-specific library — it's the overall app-layer SDK. For the SIWS/auth portion specifically, the reference implementation is [`@web3auth/sign-in-with-starkware`](https://github.com/Web3Auth/sign-in-with-starkware) (Web3Auth) and [`NethermindEth/sign-in-with-starknet`](https://github.com/NethermindEth/sign-in-with-starknet).

---

## SIWS Overview

**Sign-In With Starknet (SIWS)** is a passwordless, non-custodial auth scheme — the Starknet equivalent of EIP-4361 (Sign-In With Ethereum). The user proves wallet ownership by signing a structured message. No password, no seed phrase — just a signature.

Key properties:
- Based on **SNIP-12** (Starknet's TypedData standard, analogous to EIP-712)
- Two revisions: **Revision 0** (Pedersen hashing) and **Revision 1** (Poseidon hashing — preferred)
- Signature verified on-chain via the account contract's `is_valid_signature` entrypoint
- Works with all Starknet wallets: Argent X, Braavos, etc.

---

## The Full Flow

```
Browser / Frontend                  Cylo Backend                  Starknet On-Chain
─────────────────                   ─────────────                 ──────────────────

1. User connects wallet (Argent X / Braavos)
   address = "0x04ab..."

2. GET /api/auth/nonce?address=0x04ab...  ──────────────────────►
                                           • Generates nonce (min 8 alphanumeric chars)
                                           • Builds SignInWithStarkwareMessage object
                                           • Stores { nonce, address, expiresAt } in Redis
                                          ◄──────────────────────  Returns { nonce, typedData }

3. Frontend calls account.signMessage(typedData)
   Wallet shows human-readable message to user
   User approves → wallet signs using SNIP-12
                                                                    Account contract signs
                                          ◄──────────────────────────────────────────────
                                                                    Returns { r, s } signature

4. POST /api/auth/verify
   Body: { address, signature: [r, s], nonce }  ─────────────────►
                                           • Validates nonce (not expired, not used before)
                                           • Reconstructs message + computes hash
                                           • validate(message, signature, address) ──────►
                                                                    Calls account.is_valid_signature
                                                                    on-chain
                                           ◄──────────────────────────────────────────────
                                           • Marks nonce as used (prevents replay)
                                           • Issues JWT (httpOnly cookie)
                                          ◄──────────────────────  Returns { token }

5. Frontend stores token (httpOnly cookie recommended)
   All future requests: Authorization: Bearer <token>

6. On disconnect → clear JWT, redirect to /
```

---

## SIWS Message (Human-Readable)

This is what the wallet presents to the user before signing:

```
Cylo wants you to sign in with your Starknet account:
0x04ab1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab

Sign in to Cylo — the Agro-DeFi Marketplace on Starknet.

URI: https://cylo.ag
Version: 1
Chain ID: SN_MAIN
Nonce: a1b2c3d4e5f6
Issued At: 2026-04-13T12:00:00.000Z
Expiration Time: 2026-04-13T12:15:00.000Z
```

| Field | Description |
|-------|-------------|
| `address` | Full Starknet wallet address (felt252 as hex) |
| `statement` | Human-readable reason for signing (max 31 ASCII chars in rev 0) |
| `uri` | Origin requesting sign-in |
| `version` | SIWS spec version (always `1`) |
| `chainId` | `SN_MAIN` (mainnet) or `SN_SEPOLIA` (testnet) |
| `nonce` | Server-generated, single-use, min 8 alphanumeric chars |
| `issuedAt` | ISO 8601 timestamp of nonce creation |
| `expirationTime` | Typically 15 minutes after issue |

---

## SNIP-12 TypedData (What Gets Signed)

Starknet wallets sign **typed structured data** (SNIP-12, analogous to EIP-712). The `@web3auth/sign-in-with-starkware` library handles this encoding automatically via `message.prepareMessage()`.

```typescript
// SNIP-12 Revision 1 structure (Poseidon hashing — preferred)
const typedData = {
  types: {
    StarknetDomain: [
      { name: "name",     type: "shortstring" },
      { name: "version",  type: "shortstring" },
      { name: "chainId",  type: "shortstring" },
      { name: "revision", type: "shortstring" },
    ],
    SignInWithStarknet: [
      { name: "address",        type: "felt"      },
      { name: "statement",      type: "string"    },
      { name: "uri",            type: "string"    },
      { name: "nonce",          type: "felt"      },
      { name: "issuedAt",       type: "timestamp" },
      { name: "expirationTime", type: "timestamp" },
    ],
  },
  primaryType: "SignInWithStarknet",
  domain: {
    name:     "Cylo",
    version:  "1",
    chainId:  "SN_MAIN",   // or SN_SEPOLIA
    revision: "1",          // Use "1" for Poseidon; "0" for Pedersen
  },
  message: {
    address:        "0x04ab...",
    statement:      "Sign in to Cylo",
    uri:            "https://cylo.ag",
    nonce:          serverNonce,
    issuedAt:       issuedAtTimestamp,
    expirationTime: expiresAtTimestamp,
  },
};
```

### Hash Calculation
```
signed_data = hash(
  "StarkNet Message",   // Prefix prevents confusion with transactions
  Enc[domain_separator],
  account_address,      // Prevents hash collisions between accounts
  Enc[message]
)
```

- **Revision 0** → Pedersen hash (legacy)
- **Revision 1** → Poseidon hash (recommended — more efficient)

---

## Frontend Implementation

### Install

```bash
pnpm add @web3auth/sign-in-with-starkware @starknet-react/core starknet
```

### `hooks/use-siws.ts`

```typescript
import { useAccount } from "@starknet-react/core";
import { SignInWithStarkwareMessage } from "@web3auth/sign-in-with-starkware";
import { useAuthStore } from "@/lib/store/auth";

export function useSIWS() {
  const { address, account } = useAccount();
  const { setAuth } = useAuthStore();

  async function signIn() {
    if (!address || !account) throw new Error("Wallet not connected");

    // 1. Request nonce from backend
    const nonceRes = await fetch(`/api/auth/nonce?address=${address}`);
    const { nonce } = await nonceRes.json();

    // 2. Build SIWS message
    const message = new SignInWithStarkwareMessage({
      domain: {
        name:     "Cylo",
        version:  "1",
        chainId:  "SN_MAIN",
        revision: "1",
      },
      address,
      statement: "Sign in to Cylo",
      uri:       window.location.origin,
      nonce,
      issuedAt:       new Date().toISOString(),
      expirationTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });

    // 3. prepareMessage() converts to SNIP-12 TypedData for wallet signing
    const typedData = message.prepareMessage();
    const signature = await account.signMessage(typedData);
    // signature = [r, s] as BigInt array

    // 4. Verify with backend
    const verifyRes = await fetch("/api/auth/verify", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        address,
        signature: [signature[0].toString(), signature[1].toString()],
        message:   message.toJSON(), // full message for backend validation
      }),
    });

    if (!verifyRes.ok) throw new Error("Signature verification failed");

    const { token } = await verifyRes.json();

    // 5. Persist auth state
    setAuth(token, address);
    return token;
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    useAuthStore.getState().clearAuth();
  }

  return { signIn, signOut };
}
```

### Auto-trigger after wallet connect

```typescript
// In your ConnectWallet component
const { isConnected } = useAccount();
const { signIn } = useSIWS();
const prevConnected = useRef(false);

useEffect(() => {
  if (isConnected && !prevConnected.current) {
    signIn()
      .then(() => router.push("/dashboard"))
      .catch(console.error);
  }
  prevConnected.current = isConnected ?? false;
}, [isConnected]);
```

---

## Backend Implementation

### `GET /api/auth/nonce`

```typescript
// app/api/auth/nonce/route.ts
import { NextRequest } from "next/server";
import { randomBytes } from "crypto";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) return Response.json({ error: "address required" }, { status: 400 });

  // Nonce: min 8 alphanumeric chars, cryptographically random
  const nonce = randomBytes(12).toString("base64url");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Store in Redis with 15-min TTL (or use DB)
  await redis.set(
    `nonce:${address}`,
    JSON.stringify({ nonce, expiresAt }),
    { ex: 900 }
  );

  return Response.json({ nonce });
}
```

### `POST /api/auth/verify`

```typescript
// app/api/auth/verify/route.ts
import { NextRequest } from "next/server";
import { validate } from "@web3auth/sign-in-with-starkware";
import { SignJWT } from "jose";

export async function POST(req: NextRequest) {
  const { address, signature, message } = await req.json();

  // 1. Retrieve stored nonce
  const stored = await redis.get(`nonce:${address}`);
  if (!stored) return Response.json({ error: "Invalid nonce" }, { status: 401 });

  const { nonce: storedNonce, expiresAt } = JSON.parse(stored as string);

  // 2. Validate nonce matches and hasn't expired
  if (message.nonce !== storedNonce) {
    return Response.json({ error: "Nonce mismatch" }, { status: 401 });
  }
  if (new Date() > new Date(expiresAt)) {
    return Response.json({ error: "Nonce expired" }, { status: 401 });
  }

  // 3. Consume nonce immediately (prevents replay)
  await redis.del(`nonce:${address}`);

  // 4. Verify signature on-chain via account's is_valid_signature
  //    validate() calls account.is_valid_signature under the hood
  const isValid = await validate(message, signature, address);
  if (!isValid) return Response.json({ error: "Invalid signature" }, { status: 401 });

  // 5. Additional checks
  if (message.domain.name !== "Cylo") {
    return Response.json({ error: "Domain mismatch" }, { status: 401 });
  }

  // 6. Issue JWT
  const token = await new SignJWT({ address })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

  // 7. Set httpOnly cookie (recommended over localStorage)
  const response = Response.json({ address });
  response.headers.set(
    "Set-Cookie",
    `cylo_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`
  );
  return response;
}
```

### `POST /api/auth/logout`

```typescript
export async function POST() {
  const response = Response.json({ ok: true });
  response.headers.set(
    "Set-Cookie",
    "cylo_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
  );
  return response;
}
```

---

## Security Properties

| Property | How it's achieved |
|----------|-------------------|
| **Replay prevention** | Nonce deleted after first use — same signature can't be reused |
| **Expiry** | Nonce TTL = 15 min — short window prevents stale attacks |
| **Address binding** | Message contains the address — can't reuse across wallets |
| **Chain binding** | `chainId` in domain — mainnet sig invalid on testnet |
| **Domain binding** | `domain.name` verified server-side — prevents phishing |
| **Non-custodial** | Private key never leaves the wallet |
| **On-chain verification** | `validate()` calls `is_valid_signature` on the account contract |
| **Timestamp checks** | Backend validates `issuedAt` is recent (max 5–10 min delta) |

---

## Zustand Auth Store

```typescript
// lib/store/auth.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  address: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, address: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      address:         null,
      isAuthenticated: false,
      setAuth: (_, address) => set({ address, isAuthenticated: true }),
      clearAuth: ()         => set({ address: null, isAuthenticated: false }),
    }),
    { name: "cylo-auth" }
  )
);
```

> Note: The JWT itself lives in an httpOnly cookie (not in the store). The store tracks UI-level auth state only.

---

## Token Storage Strategy

```
Option A — localStorage
  Pro:  Easy to implement
  Con:  Vulnerable to XSS attacks

Option B — httpOnly cookie  ← Cylo uses this
  Pro:  Not accessible to JS at all — immune to XSS
  Con:  Requires CSRF protection for state-changing mutations
        (use SameSite=Strict to mitigate)

Option C — sessionStorage
  Pro:  Clears on tab close
  Con:  Still vulnerable to XSS within the session
```

---

## Flow Summary (TL;DR)

```
1. Connect wallet             → address available
2. GET /api/auth/nonce        → server issues single-use nonce
3. Build SignInWithStarkwareMessage + prepareMessage()
4. account.signMessage()      → [r, s] signature (SNIP-12 / Poseidon)
5. POST /api/auth/verify      → validate() calls is_valid_signature on-chain
6. JWT issued as httpOnly cookie
7. Redirect to /dashboard     → authenticated session begins
8. On disconnect / logout     → cookie cleared, redirect to /
```

---

## Key Resources

| Resource | Link |
|----------|------|
| Starkzap official site | https://starkzap.io |
| Starknet docs — Starkzap overview | https://docs.starknet.io/build/starkzap/overview |
| Starkzap GitHub | https://github.com/keep-starknet-strange/starkzap |
| Web3Auth SIWS library | https://github.com/Web3Auth/sign-in-with-starkware |
| NethermindEth reference impl | https://github.com/NethermindEth/sign-in-with-starknet |
| SNIP-12 standard | https://github.com/starknet-io/SNIPs/blob/main/SNIPS/snip-12.md |
| Starknet.js signature guide | https://starknetjs.com/docs/guides/signature |
| Starknet community SIWS proposal | https://community.starknet.io/t/sign-in-with-starknet-technical-proposal/95683 |
| SIWS security considerations | https://siwst.web3auth.io/security |
