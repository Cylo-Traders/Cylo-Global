import type { NextConfig } from "next";

const STUB = "./lib/stubs/empty.js";

const nextConfig: NextConfig = {
  // Starkzap includes optional sub-features (Solana bridge, Tongo confidential computing,
  // Hyperlane) that dynamically import packages we don't use in Cylo. Point them at an
  // empty stub so Turbopack doesn't error on missing peer deps.
  turbopack: {
    resolveAlias: {
      "@fatsolutions/tongo-sdk": STUB,
      "@hyperlane-xyz/sdk": STUB,
      "@hyperlane-xyz/registry": STUB,
      "@hyperlane-xyz/utils": STUB,
      "@solana/web3.js": STUB,
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "starknet.id",
        pathname: "/api/identicons/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
        pathname: "/**",
      },
    ],
    qualities: [75, 100],
    formats: ["image/webp", "image/avif"],
  },
};

export default nextConfig;
