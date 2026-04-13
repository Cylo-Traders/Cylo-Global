import { ARGENT_WEBWALLET_URL } from "@/lib/constants";

export function getConnectors() {
  if (typeof window === "undefined") return [];

  const { InjectedConnector } = require("starknetkit/injected");
  const { ArgentMobileConnector } = require("starknetkit/argentMobile");
  const { WebWalletConnector } = require("starknetkit/webwallet");

  return [
    new InjectedConnector({ options: { id: "argentX", name: "Argent X" } }),
    new InjectedConnector({ options: { id: "braavos", name: "Braavos" } }),
    new ArgentMobileConnector(),
    new WebWalletConnector({ url: ARGENT_WEBWALLET_URL }),
  ];
}
