import React, { createContext, useContext, useState, useEffect } from "react";
import { WalletClient } from "@bsv/sdk";

// -----------------------------
// Extend WalletClient for TypeScript
// -----------------------------
interface WalletClientExtended extends WalletClient {
  identityKey: string; // Desktop wallet pubKey
  sign: (txHex: string) => Promise<string>;
  pay: (params: { satoshis: number; to: string }) => Promise<{ txid: string; rawTx: string }>;
  disconnect?: () => void;
  getTokens?: () => Promise<any[]>; // BRC-100 compatible wallets
}

// -----------------------------
// Context type
// -----------------------------
export interface WalletContextType {
  pubKey: string | null;
  wallet: WalletClientExtended | null;
  lastMessage: string | null;
  isConnected: boolean;

  connectWallet: () => Promise<void>;
  disconnect: () => void;
  sign: (txHex: string) => Promise<string>;
  authenticate: (pubKey: string, jwt: string) => void;

  setLastMessage: React.Dispatch<React.SetStateAction<string | null>>;
}

// -----------------------------
// Wallet Context
// -----------------------------
const WalletContext = createContext<WalletContextType>({} as WalletContextType);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [pubKey, setPubKey] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletClientExtended | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // -----------------------------
  // Disconnect wallet
  // -----------------------------
  const disconnect = () => {
    wallet?.disconnect?.();
    setPubKey(null);
    setWallet(null);
    setIsConnected(false);
    setLastMessage("Wallet disconnected");
  };

  // -----------------------------
  // Sign transaction
  // -----------------------------
  const sign = async (txHex: string): Promise<string> => {
    if (!wallet) throw new Error("No wallet connected");
    return wallet.sign(txHex);
  };

  // -----------------------------
  // Authenticate JWT
  // -----------------------------
  const authenticate = (pubKey: string, jwt: string) => {
    localStorage.setItem("bsv_jwt", jwt);
    setPubKey(pubKey);
    setLastMessage("JWT authenticated");
  };

  // -----------------------------
  // Connect wallet
  // -----------------------------
  const connectWallet = async () => {
    setLastMessage("Connecting to wallet...");

    // BSV Desktop Wallet
    try {
      const desktopWallet = new WalletClient() as WalletClientExtended;
      await desktopWallet.waitForAuthentication();
      setWallet(desktopWallet);
      setPubKey(desktopWallet.identityKey);
      setIsConnected(true);
      setLastMessage("Connected to BSV Desktop Wallet");
      return;
    } catch (err) {
      console.warn("BSV Desktop Wallet not available:", err);
    }

    const win: any = window;

    // Metanet Client
    if (win.metanetClient?.connect) {
      try {
        const key = await win.metanetClient.connect();
        setWallet({
          sign: win.metanetClient.sign?.bind(win.metanetClient),
          pay: win.metanetClient.pay?.bind(win.metanetClient),
          disconnect: win.metanetClient.disconnect?.bind(win.metanetClient),
          identityKey: key,
          getTokens: win.metanetClient.getTokens?.bind(win.metanetClient),
        } as WalletClientExtended);
        setPubKey(key);
        setIsConnected(true);
        setLastMessage("Connected to Metanet Client");
        return;
      } catch (e) {
        console.error("Metanet Client connection failed:", e);
      }
    }

    // BRC-100 compatible wallet (if available in window)
    if (win.brc100Wallet?.connect) {
      try {
        const key = await win.brc100Wallet.connect();
        setWallet({
          sign: win.brc100Wallet.sign?.bind(win.brc100Wallet),
          pay: win.brc100Wallet.pay?.bind(win.brc100Wallet),
          disconnect: win.brc100Wallet.disconnect?.bind(win.brc100Wallet),
          identityKey: key,
          getTokens: win.brc100Wallet.getTokens?.bind(win.brc100Wallet),
        } as WalletClientExtended);
        setPubKey(key);
        setIsConnected(true);
        setLastMessage("Connected to BRC-100 Wallet");
        return;
      } catch (e) {
        console.error("BRC-100 Wallet connection failed:", e);
      }
    }

    // No wallet found
    setLastMessage("No wallet detected");
    alert("Please install BSV Desktop Wallet, Metanet Client, or a BRC-100 wallet.");
  };

  // Auto-connect on mount
  useEffect(() => {
    connectWallet();
  }, []);

  return (
    <WalletContext.Provider
      value={{
        pubKey,
        wallet,
        lastMessage,
        isConnected,
        connectWallet,
        disconnect,
        sign,
        authenticate,
        setLastMessage,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
