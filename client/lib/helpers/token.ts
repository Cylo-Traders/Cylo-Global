/** Convert a decimal string to its raw bigint representation at the given precision. */
export function parseUnits(amount: string, decimals: number): bigint {
  const [whole = "0", fraction = ""] = amount.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole + paddedFraction);
}

/** Format a raw bigint amount back to a human-readable decimal string. */
export function formatUnits(amount: bigint, decimals: number): string {
  const str = amount.toString().padStart(decimals + 1, "0");
  const whole = str.slice(0, str.length - decimals) || "0";
  const fraction = str.slice(str.length - decimals).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}
