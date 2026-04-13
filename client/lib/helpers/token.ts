import { uint256 } from "starknet";

export function parseUnits(amount: string, decimals: number): bigint {
  const [whole = "0", fraction = ""] = amount.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole + paddedFraction);
}

export function getUint256CalldataFromBN(bn: bigint) {
  return uint256.bnToUint256(bn);
}

export function parseInputAmountToUint256(
  input: string,
  decimals: number = 18,
) {
  const parsed = parseUnits(input, decimals);
  return getUint256CalldataFromBN(parsed);
}
