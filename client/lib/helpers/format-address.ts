import { validateAndParseAddress } from "starknet";

export function normalizeAddress(address: string) {
  return validateAndParseAddress(address);
}

export function formatTruncatedAddress(address: string) {
  try {
    const parsed = normalizeAddress(address);
    return `0x${parsed.slice(2, 6)}...${parsed.slice(-4)}`;
  } catch {
    return address.length > 10
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : address;
  }
}
