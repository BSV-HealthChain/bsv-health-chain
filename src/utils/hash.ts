// src/utils/hash.ts
import { Hash, Utils } from "@bsv/sdk";

/**
 * Hash a string using SHA256 from @bsv/sdk
 * @param input string to hash
 * @returns hex string of the SHA256 hash
 */
export function sha256Hex(input: string): string {
  // Convert string to number[] (UTF-8 bytes)
  const arr = Utils.toArray(input, "utf8");

  // Hash the array
  const hashed = Hash.sha256(arr);

  // Convert to hex string
  const hex = Utils.toHex(hashed);

  return hex;
}
