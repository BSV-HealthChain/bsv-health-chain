// src/utils/index.ts

/**
 * Fetch all UTXOs for a given BSV address from Whatsonchain
 * @param address - BSV address
 * @returns Array of UTXOs
 */
export async function fetchUTXOs(address: string): Promise<any[]> {
  try {
    const res = await fetch(`https://api.whatsonchain.com/v1/bsv/main/address/${address}/unspent`);
    if (!res.ok) throw new Error(`Failed to fetch UTXOs: ${res.statusText}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("fetchUTXOs error:", err);
    return [];
  }
}

/**
 * Broadcast a raw transaction to the BSV network via Whatsonchain
 * @param rawTx - Raw transaction hex
 * @returns Broadcast result object
 */
export async function broadcastRawTx(rawTx: string): Promise<any> {
  try {
    const res = await fetch("https://api.whatsonchain.com/v1/bsv/main/tx/raw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txhex: rawTx }),
    });
    if (!res.ok) throw new Error(`Failed to broadcast transaction: ${res.statusText}`);
    const data = await res.json();
    return data; // usually { txid: string }
  } catch (err) {
    console.error("broadcastRawTx error:", err);
    throw err;
  }
}

/**
 * Pick UTXOs to cover a spend + fee (with rough fee estimation)
 * @param utxos - Array of UTXOs
 * @param targetSatoshis - Amount to send in sats
 * @param feePerByte - Fee rate in sats per byte (default 1)
 * @returns Object containing selected UTXOs, total value, and estimated fee
 */
export function pickUTXOs(
  utxos: Array<{ tx_hash: string; tx_pos: number; value: number }>,
  targetSatoshis: number,
  feePerByte = 1
): { selected: typeof utxos; total: number; estFee: number } {
  const selected: typeof utxos = [];
  let total = 0;

  for (const utxo of utxos) {
    selected.push(utxo);
    total += utxo.value;
    // estimate tx size: inputs*180 + outputs*34 + 10
    const estSize = selected.length * 180 + 2 * 34 + 10;
    const estFee = estSize * feePerByte;
    if (total >= targetSatoshis + estFee) {
      return { selected, total, estFee };
    }
  }

  throw new Error("Insufficient funds: cannot cover amount + fee");
}
