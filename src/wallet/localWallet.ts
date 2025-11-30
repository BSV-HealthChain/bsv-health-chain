import {
  PrivateKey,
  PublicKey,
  Transaction,
  P2PKH,
} from "@bsv/sdk";

import * as bip39 from "bip39";

/* ---------------------------------------------------
   PASSWORD-BASED ENCRYPTION HELPERS
--------------------------------------------------- */

const SALT = "bsv-healthchain-wallet-salt";

async function deriveKey(password: string) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(SALT),
      iterations: 200000,
      hash: "SHA-256",
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptData(data: string, password: string) {
  const key = await deriveKey(password);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(data),
  );

  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted)),
  };
}

export async function decryptData(enc: any, password: string) {
  const key = await deriveKey(password);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(enc.iv) },
    key,
    new Uint8Array(enc.data),
  );

  return new TextDecoder().decode(decrypted);
}

/* ---------------------------------------------------
   MNEMONIC WALLET CREATION
--------------------------------------------------- */

export async function createMnemonicWallet(password: string, length: 12 | 24) {
  const mnemonic = bip39.generateMnemonic(length === 12 ? 128 : 256);
  const seed = await bip39.mnemonicToSeed(mnemonic);

  // Derive a simple private key from seed (BSV-compatible)
  const priv = PrivateKey.fromHex(Buffer.from(seed).subarray(0, 32).toString("hex"));
  const wif = priv.toWif();
  const pubkey = priv.toPublicKey().toString();

  // Encrypt mnemonic + WIF
  const encrypted = await encryptData(JSON.stringify({ mnemonic, wif }), password);

  localStorage.setItem("localWallet", JSON.stringify(encrypted));
  localStorage.setItem("localWalletPubkey", pubkey);

  return { mnemonic, pubkey };
}

export async function importMnemonicWallet(mnemonic: string, password: string) {
  if (!bip39.validateMnemonic(mnemonic)) throw new Error("Invalid mnemonic");

  const seed = await bip39.mnemonicToSeed(mnemonic);
  const priv = PrivateKey.fromHex(Buffer.from(seed).subarray(0, 32).toString("hex"));

  const wif = priv.toWif();
  const pubkey = priv.toPublicKey().toString();

  const encrypted = await encryptData(JSON.stringify({ mnemonic, wif }), password);

  localStorage.setItem("localWallet", JSON.stringify(encrypted));
  localStorage.setItem("localWalletPubkey", pubkey);

  return { mnemonic, pubkey };
}

export async function loadLocalWallet(password: string) {
  const stored = localStorage.getItem("localWallet");
  if (!stored) throw new Error("Wallet not found");

  const decrypted = await decryptData(JSON.parse(stored), password);
  const { wif } = JSON.parse(decrypted);

  return PrivateKey.fromWif(wif);
}

/* ---------------------------------------------------
   SIGN TX
--------------------------------------------------- */

export async function signTxRaw(rawTx: string, password: string): Promise<string> {

  if (!rawTx) throw new Error("rawTx is required");
  if (!password) throw new Error("password is required to unlock the local key");

  const priv = await loadLocalWallet(password);
  if (!priv) throw new Error("Failed to unlock local private key");

  const tx = Transaction.fromHex(rawTx);
  tx.sign();

  return tx.toHex();
}

/* ---------------------------------------------------
   PAYMENT + BROADCAST
--------------------------------------------------- */

type BroadcastResult =
  | { success: true; txid: string; rawtx: string }
  | { success: false; error: string };

export async function sendPayment(toAddress: string, satoshis: number, password: string): Promise<BroadcastResult> {
  try {
    // 1) Load decrypted local private key
    const priv: PrivateKey = await loadLocalWallet(password);
    if (!priv) return { success: false, error: "Failed to load local private key" };

    // 2) Get the sender public key and address
    const pub = priv.toPublicKey();
    // derive the address string for change outputs
    const fromAddress = pub.toAddress().toString();

    // 3) Get UTXOs for the sender address (WhatsOnChain)
    const utxos = await fetch(`https://api.whatsonchain.com/v1/bsv/main/address/${fromAddress}/unspent`)
      .then((r) => r.json());

    if (!Array.isArray(utxos) || utxos.length === 0) {
      return { success: false, error: "No UTXOs found for this address" };
    }

    // 4) Build transaction
    const tx = new Transaction();

    // Add inputs referencing previous outputs
    // NOTE: SDK accepts inputs either by sourceTransaction or by txid + index.
    // We'll add by sourceTXID + sourceOutputIndex and provide a unlocking template (P2PKH).
    const p2pkhTemplate = new P2PKH();

    for (const u of utxos) {
      // u: { tx_hash, tx_pos, value } from WOC
      const input = {
        sourceTXID: u.tx_hash,
        sourceOutputIndex: u.tx_pos,
        // attach the unlockingScriptTemplate for P2PKH using the local private key
        unlockingScriptTemplate: p2pkhTemplate.unlock(priv),
        // (optional) sequence: undefined -> final sequence used by SDK
      } as any;

      tx.addInput(input);
    }

    // 5) Create recipient locking script (P2PKH)
    // Address.fromString -> gives an Address-like object; P2PKH.lock expects either pubkey-hash or address object depending on SDK.
    const recipientAddrObj = PublicKey.fromString(toAddress);
    const recipientLockingScript = p2pkhTemplate.lock(recipientAddrObj.type|| recipientAddrObj); // try payload first, fallback to the object

    // Add recipient output
    tx.addOutput({
      satoshis,
      lockingScript: recipientLockingScript,
      change: false,
    });

    // Add a change output that the library will compute when .fee() is called
    // provide a lockingScript for change that belongs to our fromAddress
    const changeLockingScript = p2pkhTemplate.lock(recipientAddrObj.type || recipientAddrObj);

    tx.addOutput({
      // don't specify satoshis: mark as change output so tx.fee() computes it
      lockingScript: changeLockingScript,
      change: true,
    } as any);

    // 6) Compute fees and allocate change
    // This will adjust change outputs automatically
    tx.fee(); // if your SDK allows tx.fee() without parameter (default fee model). Some SDKs allow tx.fee(feeModel)

    // 7) Sign the transaction (uses unlockingScriptTemplate.sign internally)
    tx.sign(); // signs inputs that have unlocking templates

    // 8) Serialize & broadcast
    const rawhex = tx.toHex();

    // Try SDK ARC broadcast if available (preferred)
    try {
      // if ARC class exists and you have an endpoint/key use it (optional)
      // const arc = new ARC("https://api.taal.com/arc", "YOUR_API_KEY"); // optional
      // await tx.broadcast(arc);
      // but fallback to Whatsonchain ARC endpoint used commonly:
      const resp = await fetch("https://arc.whatsonchain.com/v1/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawtx: rawhex }),
      }).then(r => r.json());

      // WOC broadcast returns { txid } on success, or { error: ... }
      const txid = resp?.txid || resp?.result || resp?.data?.txid;
      if (txid) {
        return { success: true, txid, rawtx: rawhex };
      } else {
        return { success: false, error: JSON.stringify(resp) || "Broadcast failed" };
      }
    } catch (broadcastErr) {
      // last-resort: return raw hex so caller can broadcast externally
      return { success: false, error: "Broadcast attempt failed: " + String(broadcastErr) + " — rawtx: " + rawhex };
    }
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
/* ---------------------------------------------------
   BALANCE + TRANSACTIONS
--------------------------------------------------- */

export async function getBalance(address: string) {
  const data = await fetch(
    `https://api.whatsonchain.com/v1/bsv/main/address/${address}/balance`
  ).then(r => r.json());

  return data;
}

export async function getTransactions(address: string) {
  const txs = await fetch(
    `https://api.whatsonchain.com/v1/bsv/main/address/${address}/history`
  ).then(r => r.json());

  return txs;
}


export async function getLocalWalletAddresses(privateKeyHex: string): Promise<string[]> {
  // 1. Convert hex → PrivateKey object
  const priv = PrivateKey.fromString(privateKeyHex);

  // 2. Derive public key
  const pub = priv.toPublicKey();

  // 3. Encode BSV P2PKH address


  const address = pub.toAddress();


  return [address];
}


export async function createLocalWallet(_password: string) {
  const priv = PrivateKey.fromRandom();
  const pubkey = priv.toPublicKey().toString();
  const wif = priv.toWif();

  return { priv, pubkey, wif };
}

export async function importLocalWallet( password: string) {
  
  const priv = PrivateKey.fromRandom();
  const pubkey = priv.toPublicKey().toString();
  const wif = priv.toWif();

  const encrypted = await encryptData(JSON.stringify({ wif }), password);

  localStorage.setItem("localWallet", JSON.stringify(encrypted));
  localStorage.setItem("localWalletPubkey", pubkey);

  return { pubkey };
}
/* ---------------------------------------------------
   PDF BACKUP GENERATOR
--------------------------------------------------- */

import { PDFDocument, StandardFonts } from "pdf-lib";

export async function exportWalletPDF(mnemonic: string, pubkey: string, addresses: string[]) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage();

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  let y = 750;

  const draw = (text: string) => {
    page.drawText(text, { x: 50, y, size: 12, font });
    y -= 20;
  };

  draw("BSV HealthChain Wallet Backup");
  draw("--------------------------------------------");
  draw(`Date: ${new Date().toLocaleString()}`);
  draw("");
  draw("Mnemonic (Backup Phrase):");
  draw(mnemonic);
  draw("");
  draw("Public Key:");
  draw(pubkey);
  draw("");
  draw("Addresses:");
  addresses.forEach((a, i) => draw(`${i + 1}. ${a}`));

  const pdfBytes = await pdf.save();

  const copy = new Uint8Array(pdfBytes.length);
copy.set(pdfBytes); // <-- forces creation of normal ArrayBuffer

const blob = new Blob([copy.buffer], { type: "application/pdf" });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "bsv_healthchain_wallet_backup.pdf";
  link.click();
}
// function unlockPrivateKey(password: any) {
 // throw new Error("Function not implemented.");
// }

