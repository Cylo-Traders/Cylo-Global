"use client";

import { ReactNode } from "react";
import { sepolia, mainnet } from "@starknet-react/chains";
import {
  StarknetConfig,
  publicProvider,
  argent,
  braavos,
} from "@starknet-react/core";

const chains = [mainnet, sepolia];
const provider = publicProvider();

function getConnectors() {
  if (typeof window === "undefined") return [];
  return [argent(), braavos()];
}

export function StarknetProvider({ children }: { children: ReactNode }) {
  return (
    <StarknetConfig
      chains={chains}
      provider={provider}
      connectors={getConnectors()}
      autoConnect
    >
      {children}
    </StarknetConfig>
  );
}
