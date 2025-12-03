import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { type SignActionResult, PrivateKey, WalletClient } from "@bsv/sdk";
import UnifiedWalletModal from "../components/UnifiedWalletModal";

// Local wallet helpers 
import {
  signTxRaw,
  sendPayment,
  // helpers for mnemonic/local wallets
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
  priv: string;      
  pubkey: string;    
  wif: string;      
}

export interface Token {  
  id: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  metadataUrl?: string;
  type?: "fungible" | "non-fungible";
}

export interface WalletClientExtended {
  [x: string]: any;
  identityKey: string;
  sign: (txHex: string) => Promise<SignActionResult>;
  
  pay?: (params: { satoshis: number; to: string }) => Promise<any>;
  getTokens?: () => Promise<Token[]>;
  substrate?: any;
  connectToSubstrate?: () => Promise<void>;
  createAction?: (...args: any[]) => Promise<any>;
  signAction?: (...args: any[]) => Promise<any>;
  disconnect?: () => void;
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

  balances: Record<string, Balances>; // keyed by address
  refreshBalances: () => Promise<void>;

  // UI helpers
  setLastMessage: React.Dispatch<React.SetStateAction<string | null>>;
  localWallet?: LocalWallet | null;  // storage for private info
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

  const [balances, setBalances] = useState<Record<string, Balances>>({});

  const rememberProvider = (p: WalletKind | null) => {
    setLastProvider(p);
    if (p) localStorage.setItem(LAST_PROVIDER_KEY, p);
    else localStorage.removeItem(LAST_PROVIDER_KEY);
  };

  /* -----------------------------
     Provider connection helpers
     ----------------------------- */

// Public connect function
const connectWalletByType = async (type: WalletKind): Promise<string | null> => {
  const win: any = window;
  let walletKey: string | null = null;

  if (type === "desktop") {
    try {
      const desktopWallet = new WalletClient() as unknown as WalletClientExtended;
      await desktopWallet.waitForAuthentication();
      if (desktopWallet.identityKey) {
        setWallet(desktopWallet);
        walletKey = desktopWallet.identityKey;
      }
    } catch (err) {
      console.warn("BSV Desktop Wallet not available:", err);
    }
  } else if (type === "metanet") {
    try {
      await win.metanet.waitForAuthentication();
      walletKey = win.metanet.getPublicKey?.();
      if (walletKey) {
        setWallet({
          identityKey: walletKey,
          sign: win.metanet.sign.bind(win.metanet),
          pay: win.metanet.pay?.bind(win.metanet),
        } as WalletClientExtended);
      }
    } catch (err) {
      console.warn("Metanet Wallet failed", err);
    }
  } else if (type === "local") {
    const local = localStorage.getItem(LOCAL_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      const enc = new TextEncoder();
      const hash = await crypto.subtle.digest("SHA-256", enc.encode(parsed.privateHex));
      walletKey = Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      setWallet({
        identityKey: walletKey,
        sign: async (tx) => {
          const pwd = prompt("Enter wallet password to sign transaction");
          if (!pwd) throw new Error("Password required");
          const signedHex = await signTxRaw(tx, pwd);
          return { tx: signedHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)) };
        },
        pay: async ({ satoshis, to }) => {
          const pwd = prompt("Enter wallet password to pay");
          if (!pwd) throw new Error("Password required");
          return sendPayment(to, satoshis, pwd);
        },
      } as WalletClientExtended);
    }
  }

  if (walletKey) {
    setPubKey(walletKey);
    setIsConnected(true);
    rememberProvider(type);
    setLastMessage(`${type} wallet connected`);
  } else {
    setLastMessage(`${type} wallet connection failed`);
  }

  await refreshBalances();
  return walletKey;
};

  /* -----------------------------
     Local wallet management helpers (expose in context)
     ----------------------------- */

  const createLocalWallet = async (password?: string): Promise<LocalWallet> => {
    const rand = crypto.getRandomValues(new Uint8Array(32));
  const privHex = Array.from(rand).map(b => b.toString(16).padStart(2,"0")).join("");
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(privHex));
  const pubHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,"0")).join("");
    
  try {
    if (typeof createLocalWalletHelper === "function") {
      const pub = await createLocalWalletHelper(password || "");
      const localWallet: LocalWallet = {
        priv: "",    
        pubkey: pub.wif,
        wif: "",      
      };
      setWallet({
    identityKey: pubHex,
    sign: async () => { throw new Error("Local signing not implemented"); },
  } as WalletClientExtended);

  setPubKey(pubHex);
  setIsConnected(true);
  setLocalWallet(localWallet);  
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

    const signedHex = await signTxRaw(tx, pwd); 

    const signedBytes: number[] = signedHex
      .match(/.{2}/g)!
      .map((byte) => parseInt(byte, 16));

    return { tx: signedBytes };  
  },
  pay: async ({ satoshis, to }) => {
    const pwd = prompt("Enter wallet password to make payment");
    if (!pwd) throw new Error("Password required");
    return sendPayment(to, satoshis, pwd); 
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
          const mapped: Record<string, Balances> = {};
          if (Array.isArray(tokens)) {
            for (const t of tokens as any[]) {
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
              }
            }
          }
          if (Object.keys(mapped).length === 0 && pubKey) {
            mapped[pubKey] = { bsv: 0, sats: 0 };
          }

          setBalances(mapped);
          setLastMessage("Balances updated (via wallet.getTokens())");
          return;
        } catch (e) {
          console.warn("wallet.getTokens() failed, fallback to WOC for local addresses", e);
        }
      }

      let addrs: string[] = [];
      if (typeof getLocalWalletAddresses === "function") {
        try {
          const privateHex = "privateKeyHex"; 

          addrs = await getLocalWalletAddresses(privateHex);
        } catch (e) {
          console.warn("getLocalWalletAddresses failed", e);
          addrs = [];
        }
      }

      if (addrs.length === 0 && pubKey) {
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

  const connectWallet = async (): Promise<string | null> => {
  // You can delegate to your modal handler
  openWalletModal();
  return null;
};


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
      connectWalletByType,
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
    [pubKey, wallet, isConnected, lastProvider, lastMessage, balances]
  )
  return (
    <WalletContext.Provider value={ctxValue}>
      {children}
      {showModal && (
        <UnifiedWalletModal
          onClose={() => setShowModal(false)}
          onConnected={async (connectedPubKey: string, type: "external" | "local") => {
            setPassword("");
            setShowModal(false);
            setPubKey(connectedPubKey);
            setIsConnected(true);
            rememberProvider(type === "local" ? "local" : null);
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

            await refreshBalances();
          }}
        />
      )}
    </WalletContext.Provider>
    );
  }
export const useWallet = () => useContext(WalletContext);
export default WalletContext;
