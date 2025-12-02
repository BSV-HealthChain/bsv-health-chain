// src/context/walletContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { type SignActionResult, PrivateKey } from "@bsv/sdk";
import UnifiedWalletModal from "../components/UnifiedWalletModal";

// Local wallet helpers you provided earlier (adjust names if your file differs)
import {
  signTxRaw,
  sendPayment,
  // optional: helpers for mnemonic/local wallets
  getLocalWalletAddresses,
  createMnemonicWallet,
  importMnemonicWallet,
  createLocalWallet as createLocalWalletHelper,
  importLocalWallet as importLocalWalletHelper,
} from "../wallet/localWallet";

/* -----------------------------
   Types
   ----------------------------- */

type WalletKind = "desktop" | "metanet" | "brc100" | "local";

interface LocalWallet {
  priv: string;      // private key in hex or WIF
  pubkey: string;    // public key
  wif: string;       // optional WIF representation
}


export interface Token {
  /** Unique identifier for the token (e.g., token ID or genesis transaction hash) */
  id: string;

  /** Symbol or shorthand for the token, e.g., "BRV" */
  symbol: string;

  /** Full display name of the token */
  name: string;

  /** Total amount of this token owned by the wallet (in satoshis or token units) */
  balance: number;

  /** Decimal precision for the token (e.g., 0 for whole tokens, 8 for satoshi-like) */
  decimals: number;

  /** Optional metadata URL for token information (JSON, image, etc.) */
  metadataUrl?: string;

  /** Optional type: "fungible" | "non-fungible" */
  type?: "fungible" | "non-fungible";
}



export interface WalletClientExtended {
  identityKey: string;

  // minimal subset you actually implement
  sign: (txHex: string) => Promise<SignActionResult>;
  
  pay?: (params: { satoshis: number; to: string }) => Promise<any>;
  getTokens?: () => Promise<Token[]>; // add this

  // Optional SDK methods (not required, but allowed)
  substrate?: any;
  connectToSubstrate?: () => Promise<void>;
  createAction?: (...args: any[]) => Promise<any>;
  signAction?: (...args: any[]) => Promise<any>;
  disconnect?: () => void; // <-- add this
}


export interface Balances {
  bsv: number; // in BSV (not sats)
  sats: number;
  USD?: number;
  EUR?: number;
  GBP?: number;
}

export interface WalletContextType {
  pubKey: string | null;
  wallet: WalletClientExtended | null;
  isConnected: boolean;
  lastProvider: WalletKind | null;
  lastMessage: string | null;
  password?: string;
  setPassword?: (p: string) => void;

  // connection
  connectWallet: (preferred?: WalletKind) => Promise<string | null >;
  disconnect: () => void;
  openWalletModal: () => void;

  // local wallet management
  createLocalWallet: (password?: string) => Promise<LocalWallet>;
  importLocalWallet: (privateHexOrWIF: string, password?: string) => Promise<string>;
  createMnemonicWallet: (password: string, length: 12 | 24) => Promise<{ mnemonic: string; pubkey: string }>;
  importMnemonicWallet: (mnemonic: string, password: string) => Promise<{ pubkey: string }>;
  deleteLocalWallet: () => void;

  // actions
  sign: (txHex: string) => Promise<SignActionResult>;
  pay: (params: { satoshis: number; to: string }) => Promise<{ txid: string; rawTx: string }>;

  // balances
  balances: Record<string, Balances>; // keyed by address
  refreshBalances: () => Promise<void>;

  // UI helpers
  setLastMessage: React.Dispatch<React.SetStateAction<string | null>>;
  localWallet?: LocalWallet | null;  // <-- store private info here
}

const WalletContext = createContext<WalletContextType>({} as WalletContextType);

/* -----------------------------
   Constants & storage keys
   ----------------------------- */

const LOCAL_KEY = "bsv_local_wallet_v1";
const LAST_PROVIDER_KEY = "bsv_last_provider_v1";


/* -----------------------------
   Helper: fetch fiat rates (Coingecko)
   ----------------------------- */
async function fetchFiatRates(): Promise<{ usd: number; eur: number; gbp: number }> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin-sv&vs_currencies=usd,eur,gbp"
    );
    const j = await res.json();
    const rates = j?.["bitcoin-sv"] || { usd: 0, eur: 0, gbp: 0 };
    return { usd: rates.usd || 0, eur: rates.eur || 0, gbp: rates.gbp || 0 };
  } catch (e) {
    console.warn("fetchFiatRates failed", e);
    return { usd: 0, eur: 0, gbp: 0 };
  }
}

/* -----------------------------
   Helper: Whatsonchain balance fetch (address => sats)
   ----------------------------- */
async function fetchWocBalanceSats(address: string): Promise<number> {
  try {
    const res = await fetch(`https://api.whatsonchain.com/v1/bsv/main/address/${address}/balance`);
    const j = await res.json();
    // WOC returns { confirmed: number, unconfirmed: number } in sats
    const total = (j.confirmed || 0) + (j.unconfirmed || 0);
    return total;
  } catch (e) {
    console.warn("WOC balance fetch failed", e);
    return 0;
  }
}

/* -----------------------------
   Wallet Provider
   ----------------------------- */

export const WalletProvider : React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pubKey, setPubKey] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletClientExtended | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastProvider, setLastProvider] = useState<WalletKind | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [_password, setPassword] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [_localWallet, setLocalWallet] = useState<LocalWallet | null>(null);

  // balances keyed by address
  const [balances, setBalances] = useState<Record<string, Balances>>({});

  // small helper to persist provider selection
  const rememberProvider = (p: WalletKind | null) => {
    setLastProvider(p);
    if (p) localStorage.setItem(LAST_PROVIDER_KEY, p);
    else localStorage.removeItem(LAST_PROVIDER_KEY);
  };

  /* -----------------------------
     Provider connection helpers
     ----------------------------- */

  // Public connect function
const connectWallet = async (preferred?: WalletKind): Promise<string | null> => {
  setLastMessage("Connecting to wallet...");
  const win: any = window;
  let walletKey: string | null = null;

  // Helper to try connecting a provider
  const tryProvider = async (kind: WalletKind): Promise<boolean> => {
    try {
      switch (kind) {
        case "desktop":
          if (!win.bsvDesktop) return false;
          await win.bsvDesktop.waitForAuthentication(); // pops up login
          walletKey = win.bsvDesktop.getPublicKey?.() || null;
          break;

        case "metanet":
          if (!win.metanetWallet) return false;
          walletKey = await win.metanetWallet.getPublicKey?.();
          break;

        case "brc100":
          if (!win.brc100Wallet) return false;
          walletKey = await win.brc100Wallet.getPublicKey?.();
          break;

        case "local":
          const local = localStorage.getItem(LOCAL_KEY);
          if (!local) return false;

          const parsed = JSON.parse(local);
          const enc = new TextEncoder();
          const data = enc.encode(parsed.privateHex);
          const hash = await crypto.subtle.digest("SHA-256", data);
          const pubHex = Array.from(new Uint8Array(hash))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

          const localWallet: WalletClientExtended = {
            identityKey: pubHex,
            sign: async (tx: string) => {
              const pwd = prompt("Enter password to sign");
              if (!pwd) throw new Error("Password required");
              const signedHex = await signTxRaw(tx, pwd);
              const signedBytes: number[] = signedHex.match(/.{2}/g)!.map((b) => parseInt(b, 16));
              return { tx: signedBytes };
            },
            pay: async ({ satoshis, to }) => {
              const pwd = prompt("Enter password to pay");
              if (!pwd) throw new Error("Password required");
              return sendPayment(to, satoshis, pwd);
            },
          };

          setWallet(localWallet);
          walletKey = pubHex;
          break;
      }

      if (walletKey) {
        setPubKey(walletKey);
        setIsConnected(true);
        rememberProvider(kind);
        setLastMessage(`Connected via ${kind}`);
        return true;
      }
    } catch (err) {
      console.warn(`Failed to connect ${kind} wallet:`, err);
    }
    return false;
  };

  // 1️⃣ Preferred wallet first
  if (preferred && (await tryProvider(preferred))) return walletKey;

  // 2️⃣ Restore last provider
  const last = (localStorage.getItem(LAST_PROVIDER_KEY) as WalletKind) || null;
  if (last && (await tryProvider(last))) return walletKey;

  // 3️⃣ Try Desktop retries for bridge
  for (let i = 0; i < 5; i++) {
    if (await tryProvider("desktop")) return walletKey;
    await new Promise((r) => setTimeout(r, 500));
  }

  // 4️⃣ Try Metanet and BRC-100
  if (await tryProvider("metanet")) return walletKey;
  if (await tryProvider("brc100")) return walletKey;

  // 5️⃣ Local wallet fallback
  if (await tryProvider("local")) return walletKey;

  // 6️⃣ No wallet found → show modal
  setLastMessage("No compatible wallet detected");
  setShowModal(true);
  return null;
};



  /* -----------------------------
     Local wallet management helpers (expose in context)
     - these wrap your wallet/localWallet helpers (if available)
     ----------------------------- */

  const createLocalWallet = async (password?: string): Promise<LocalWallet> => {
    // fallback to simple (insecure) create: generate pseudo private and store
    const rand = crypto.getRandomValues(new Uint8Array(32));
  const privHex = Array.from(rand).map(b => b.toString(16).padStart(2,"0")).join("");
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(privHex));
  const pubHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,"0")).join("");
    
  try {
    if (typeof createLocalWalletHelper === "function") {
      const pub = await createLocalWalletHelper(password || "");
      const localWallet: LocalWallet = {
        priv: "",      // fill from helper if available
        pubkey: pub.wif,
        wif: "",       // optional
      };
      setWallet({
    identityKey: pubHex,
    sign: async () => { throw new Error("Local signing not implemented"); },
  } as WalletClientExtended);

  setPubKey(pubHex);
  setIsConnected(true);
  setLocalWallet(localWallet);  // <-- assign to context
  setLastMessage("Created demo local wallet (no signing).");
  return localWallet;
};

  } catch (e) {
    console.warn("createLocalWallet helper failed", e);
  }


  localStorage.setItem(LOCAL_KEY, JSON.stringify({ privateHex: privHex, createdAt: new Date().toISOString() }));

    setWallet({
      identityKey: pubHex,
      sign: async () => { throw new Error("Local signing not implemented"); },
      pay: async () => { throw new Error("Local pay not implemented"); },
    } as WalletClientExtended);
    setPubKey(pubHex);
    setIsConnected(true);
    rememberProvider("local");
    setLastMessage("Created demo local wallet (no signing).");
    const privKeyObj = PrivateKey.fromHex(privHex);
    const wifHex = privKeyObj.toWif();
  
    return {
  priv: privHex,
  pubkey: pubHex,
  wif: wifHex,
} as LocalWallet;
  };

  const importLocalWallet = async (privateHexOrWIF: string, _password?: string) => {
    try {
      if (typeof importLocalWalletHelper === "function") {
        const pub = await importLocalWalletHelper(privateHexOrWIF|| "password");
        const enc = new TextEncoder();
        const hash = await crypto.subtle.digest("SHA-256", enc.encode(privateHexOrWIF));
        const pubHex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
        setWallet({
  identityKey: pubHex,
  sign: async (tx: string): Promise<SignActionResult> => {
    const pwd = prompt("Enter wallet password to sign transaction");
    if (!pwd) throw new Error("Password required");

    const signedHex = await signTxRaw(tx, pwd); // returns hex string

    // Convert hex string → number[]
    const signedBytes: number[] = signedHex
      .match(/.{2}/g)!
      .map((byte) => parseInt(byte, 16));

    return { tx: signedBytes };  // SignActionResult expects number[]
  },
  pay: async ({ satoshis, to }) => {
    const pwd = prompt("Enter wallet password to make payment");
    if (!pwd) throw new Error("Password required");
    return sendPayment(to, satoshis, pwd); // call your helper directly
} 
} as WalletClientExtended);


        setPubKey(pub.pubkey);
        setIsConnected(true);
        rememberProvider("local");
        setLastMessage("Imported local wallet");
        return pubHex;
      }
    } catch (e) {
      console.warn("importLocalWallet helper failed", e);
    }

    // fallback store
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ privateHex: privateHexOrWIF, createdAt: new Date().toISOString() }));
    const enc = new TextEncoder();
    const hash = await crypto.subtle.digest("SHA-256", enc.encode(privateHexOrWIF));
    const pubHex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
    setPubKey(pubHex);
    setIsConnected(true);
    rememberProvider("local");
    setLastMessage("Imported demo local wallet (no signing).");
    return pubHex;
  };

  const deleteLocalWallet = () => {
    localStorage.removeItem(LOCAL_KEY);
    if (lastProvider === "local") rememberProvider(null);
    setWallet(null);
    setPubKey(null);
    setIsConnected(false);
    setLastMessage("Local wallet deleted");
  };

  const createMnemonic = async (password: string, length: 12 | 24) => {
    if (typeof createMnemonicWallet === "function") {
      const { mnemonic, pubkey } = await createMnemonicWallet(password, length);
      setLastMessage("Mnemonic wallet created. Make sure to back up your seed.");
      // set wallet wrapper using signTxRaw/sendPayment
      setWallet({
        identityKey: pubkey,
        sign: async (tx) => {
          const pwd = password || prompt("Enter wallet password to sign");
          if (!pwd) throw new Error("Password required");
          return signTxRaw(tx, pwd);
        },
        pay: async ({ satoshis, to }) => {
          const pwd = password || prompt("Enter wallet password to pay");
          if (!pwd) throw new Error("Password required");
          return sendPayment(to, satoshis, pwd);
        },
      } as WalletClientExtended);
      setPubKey(pubkey);
      setIsConnected(true);
      rememberProvider("local");
      return { mnemonic, pubkey };
    } else {
      throw new Error("createMnemonicWallet not implemented in wallet helper");
    }
  };

  const importMnemonic = async (mnemonic: string, password: string) => {
    if (typeof importMnemonicWallet === "function") {
      const { pubkey } = await importMnemonicWallet(mnemonic, password);
      setWallet({
        identityKey: pubkey,
        sign: async (tx) => {
          const pwd = password || prompt("Enter wallet password to sign");
          if (!pwd) throw new Error("Password required");
          return signTxRaw(tx, pwd);
        },
        pay: async ({ satoshis, to }) => {
          const pwd = password || prompt("Enter wallet password to pay");
          if (!pwd) throw new Error("Password required");
          return sendPayment(to, satoshis, pwd);
        },
      } as WalletClientExtended);
      setPubKey(pubkey);
      setIsConnected(true);
      rememberProvider("local");
      setLastMessage("Imported mnemonic wallet");
      return { pubkey };
    } else {
      throw new Error("importMnemonicWallet not implemented in wallet helper");
    }
  };

  /* -----------------------------
     Balance logic
     - If connected wallet provides getTokens(), use it
     - Else (local) fallback to Whatsonchain per address + convert to fiat via Coingecko
     - balances: Record<address, Balances>
     ----------------------------- */

  const refreshBalances = async () => {
    try {
      setLastMessage("Refreshing balances...");
      if (!wallet && !pubKey) {
        setLastMessage(null);
        return;
      }

      // 1) If wallet exposes getTokens(), use it (external providers)
      if (wallet?.getTokens && typeof wallet.getTokens === "function") {
        try {
          const tokens = await wallet.getTokens();
          // tokens format varies by provider; we'll try to interpret common patterns:
          // Example expected: [{ token: "BSV", balance: 0.001 }, { token: "USD", balance: 1.23 }, ... ]
          // Fallback to attempt to map by symbol / name
          const mapped: Record<string, Balances> = {};

          // if provider returns address-level balances, use them
          if (Array.isArray(tokens)) {
            // attempt a simple mapping: token objects with address or symbol
            for (const t of tokens as any[]) {
              // if provider returns address property, prefer that
              const addr = t.address || t.pubkey || pubKey || "unknown";
              const sym = (t.symbol || t.token || t.name || "").toString().toUpperCase();

              mapped[addr] = mapped[addr] || { bsv: 0, sats: 0 };

              if (sym === "BSV") {
                const bsvVal = Number(t.balance ?? t.amount ?? 0);
                mapped[addr].bsv = bsvVal;
                mapped[addr].sats = Math.round(bsvVal * 1e8);
              } else if (sym === "SATS") {
                const sats = Number(t.balance ?? t.amount ?? 0);
                mapped[addr].sats = sats;
                mapped[addr].bsv = sats / 1e8;
              } else if (["USD", "EUR", "GBP"].includes(sym)) {
                mapped[addr][sym as keyof Balances] = Number(t.balance ?? t.amount ?? 0);
              } else {
                // unknown token — ignore or store as extra (not in this structure)
              }
            }
          }

          // if we didn't map anything meaningful, try to create a default entry for pubKey
          if (Object.keys(mapped).length === 0 && pubKey) {
            mapped[pubKey] = { bsv: 0, sats: 0 };
          }

          setBalances(mapped);
          setLastMessage("Balances updated (via wallet.getTokens())");
          return;
        } catch (e) {
          console.warn("wallet.getTokens() failed, fallback to WOC for local addresses", e);
          // fallthrough to fallback
        }
      }

      // 2) Otherwise fallback: local wallet addresses -> WOC + coingecko
      // Try use getLocalWalletAddresses helper if available
      let addrs: string[] = [];
      if (typeof getLocalWalletAddresses === "function") {
        try {
          const privateHex = "privateKeyHex"; // make sure this exists

          addrs = await getLocalWalletAddresses(privateHex);
        } catch (e) {
          console.warn("getLocalWalletAddresses failed", e);
          addrs = [];
        }
      }

      // If no addresses from helper but we have a pubKey, try to derive a single address
      if (addrs.length === 0 && pubKey) {
        // it's better to rely on wallet helper to derive addresses; as a fallback, attempt to treat pubKey as address
        addrs = [pubKey];
      }

      const fiat = await fetchFiatRates();
      const newBalances: Record<string, Balances> = {};

      for (const addr of addrs) {
        const sats = await fetchWocBalanceSats(addr); // sats
        const bsv = sats / 1e8;
        newBalances[addr] = {
          bsv,
          sats,
          USD: bsv * fiat.usd,
          EUR: bsv * fiat.eur,
          GBP: bsv * fiat.gbp,
        };
      }

      setBalances(newBalances);
      setLastMessage("Balances updated (via Whatsonchain)");
    } catch (err) {
      console.warn("refreshBalances error", err);
      setLastMessage("Failed to refresh balances");
    }
  };

  // periodic refresh every 15 seconds when connected
  useEffect(() => {
    let interval: number | undefined;
    if (isConnected) {
      // initial refresh
      refreshBalances().catch(() => {});
      interval = window.setInterval(() => {
        refreshBalances().catch(() => {});
      }, 15000);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, wallet, pubKey]);

  /* -----------------------------
     Sign / pay wrappers
     ----------------------------- */

  const sign = async (txHex: string) => {
    if (!wallet) throw new Error("No wallet connected");
    if (!wallet.sign) throw new Error("Connected wallet does not support signing");
    return wallet.sign(txHex);
  };

  const pay = async (params: { satoshis: number; to: string }) => {
    if (!wallet) throw new Error("No wallet connected");
    if (!wallet.pay) throw new Error("Connected wallet does not support pay()");
    return wallet.pay(params);
  };

  const disconnect = () => {
    try {
      wallet?.disconnect?.();
    } catch (err) {
      console.warn("Disconnect error:", err);
    }
    setWallet(null);
    setPubKey(null);
    setIsConnected(false);
    rememberProvider(null);
    setLastMessage("Wallet disconnected");
  };

  
  /* -----------------------------
     Unified modal handler (used by UI)
     ----------------------------- */
  const openWalletModal = () => setShowModal(true);

  /* -----------------------------
     Context value
     ----------------------------- */
  const ctxValue = useMemo(
    () => ({
      pubKey,
      wallet,
      isConnected,
      lastProvider,
      lastMessage,

      connectWallet,
      disconnect,
      openWalletModal,

      createLocalWallet,
      importLocalWallet,
      createMnemonicWallet: createMnemonic,
      importMnemonicWallet: importMnemonic,
      deleteLocalWallet,

      sign,
      pay,

      balances,
      refreshBalances,

      mobileConnect: (name: "handcash" | "relayx" | "panda", params?: Record<string, string>) => {
        // lightweight mobile deep-link builder (kept simple)
        let url = " ";
        const query = params ? "?" + new URLSearchParams(params).toString() : "";
        if (name === "handcash") url = `handcash://connect${query}`;
        if (name === "relayx") url = `relayx://connect${query}`;
        if (name === "panda") url = `panda://connect${query}`;
      },

      setLastMessage,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pubKey, wallet, isConnected, lastProvider, lastMessage, balances]
  )
  return (
    <WalletContext.Provider value={ctxValue}>
      {children}
      {showModal && (
        <UnifiedWalletModal
          onClose={() => setShowModal(false)}
          onConnected={async (connectedPubKey: string, type: "external" | "local") => {
            // when the modal reports a local wallet connection, wire local signing to helpers
            setPassword("");
            setShowModal(false);
            setPubKey(connectedPubKey);
            setIsConnected(true);
            rememberProvider(type === "local" ? "local" : null);

            // attach sign/pay wrappers for local wallet path
            if (type === "local") {
              setWallet({
                identityKey: connectedPubKey,
                sign: async (tx) => {
                  const pwd = prompt("Enter your wallet password to sign transaction");
                  if (!pwd) throw new Error("Password required");
                  return signTxRaw(tx, pwd);
                },
                pay: async ({ satoshis, to }) => {
                  const pwd = prompt("Enter your wallet password to pay");
                  if (!pwd) throw new Error("Password required");
                  return sendPayment(to, satoshis, pwd);
                },
              } as WalletClientExtended);
              setLastMessage("Local wallet connected");
              rememberProvider("local");
            } else {
              setLastMessage("External wallet connected");
            }

            // refresh balances right after connection
            await refreshBalances();
          }}
        />
      )}
    </WalletContext.Provider>
    );
  }
export const useWallet = () => useContext(WalletContext);
export default WalletContext;
