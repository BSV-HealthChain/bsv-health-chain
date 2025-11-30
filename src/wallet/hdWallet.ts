import * as bip39 from "bip39";
import bip32Factory from "bip32";
import * as ecc from "tiny-secp256k1";

import { PrivateKey } from "@bsv/sdk";


const bip32 = bip32Factory(ecc);
// Generate master seed from mnemonic
export async function generateMasterKey(mnemonic: string) {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error("Invalid mnemonic");
  }
  const seed = await bip39.mnemonicToSeed(mnemonic);
  return bip32.fromSeed(seed);
}

// Use bip32.BIP32Interface type from the instance
export function deriveAddress(master: ReturnType<typeof bip32.fromSeed>, index: number) {
  const path = `m/44'/236'/0'/0/${index}`;
  const node = master.derivePath(path);
  const priv = PrivateKey.fromHex(node.privateKey!.toString());
  const pubkey = priv.toPublicKey();
  const address = pubkey.toAddress().toString();
  return { priv, pubkey: pubkey.toString(), address };
}

// Generate multiple addresses
export function generateAddresses(master: ReturnType<typeof bip32.fromSeed>, count: number = 5) {
  return Array.from({ length: count }, (_, i) => deriveAddress(master, i));
}
