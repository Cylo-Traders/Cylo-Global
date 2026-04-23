/**
 * Pad a Starknet address to the canonical 66-char form (0x + 64 hex digits).
 * Pure string — no starknet.js dependency needed.
 */
export function normalizeAddress(address: string): string {
  const hex = address.startsWith("0x") ? address.slice(2) : address;
  return "0x" + hex.padStart(64, "0");
}

/** Display a Starknet address as 0x1234…abcd */
export function formatTruncatedAddress(address: string): string {
  try {
    const normalized = normalizeAddress(address);
    return `${normalized.slice(0, 6)}…${normalized.slice(-4)}`;
  } catch {
    return address.length > 10
      ? `${address.slice(0, 6)}…${address.slice(-4)}`
      : address;
  }
}
