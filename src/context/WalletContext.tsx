import React, { createContext, useContext, useState } from "react";
import { WalletClient } from "@bsv/sdk";

// -----------------------------
// Extend WalletClient for TypeScript
// -----------------------------
type WalletClientExtended = {
  identityKey: string;
  sign: (txHex: string) => Promise<string>;
  pay?: (params: { satoshis: number; to: string }) => Promise<{ txid: string; rawTx: string }>;
  disconnect?: () => void;
  getTokens?: () => Promise<any[]>;
} & Partial<WalletClient>;


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

  const win: any = window;

  // ----------------------------------------------------
  // 1. BSV DESKTOP WALLET DETECTION
  // ----------------------------------------------------
  try {
    console.log("Checking for BSV Desktop Wallet…");

    // Desktop Wallet ALWAYS injects this
    if (win.bsvDesktop || win.bsvdesktop || win.BsvDesktop) {
      console.log("BSV Desktop Wallet flag detected!");

      const desktopWallet = new WalletClient() as WalletClientExtended;

      try {
        // Try handshake
        if (desktopWallet?.waitForAuthentication) {
  await desktopWallet.waitForAuthentication();
} else {
  console.warn("waitForAuthentication() is not available on this wallet.");
}


        if (desktopWallet.identityKey) {
          console.log("Desktop wallet authenticated:", desktopWallet.identityKey);

          setWallet(desktopWallet);
          setPubKey(desktopWallet.identityKey);
          setIsConnected(true);
          setLastMessage("Connected to BSV Desktop Wallet");

          return;
        }

        console.warn("Desktop Wallet present but identityKey missing");
      } catch (authErr) {
        console.warn("Desktop Wallet handshake failed:", authErr);
      }
    } else {
      console.log("No Desktop Wallet flag found");
    }
  } catch (e) {
    console.warn("Desktop Wallet detection error:", e);
  }

  // ----------------------------------------------------
  // 2. METANET CLIENT DETECTION
  // ----------------------------------------------------
  try {
    console.log("Checking Metanet Client…");

    if (win.metanetClient?.connect) {
      const key = await win.metanetClient.connect();

      console.log("Metanet connected, pubkey:", key);

      setWallet({
        sign: win.metanetClient.sign.bind(win.metanetClient),
        pay: win.metanetClient.pay?.bind(win.metanetClient),
        disconnect: win.metanetClient.disconnect?.bind(win.metanetClient),
        getTokens: win.metanetClient.getTokens?.bind(win.metanetClient),
        identityKey: key,
      });

      setPubKey(key);
      setIsConnected(true);
      setLastMessage("Connected to Metanet Client");

      return;
    }
  } catch (e) {
    console.error("Metanet connect failed:", e);
  }

  // ----------------------------------------------------
  // 3. BRC-100 WEB WALLET DETECTION
  // ----------------------------------------------------
  try {
    console.log("Checking BRC-100 Wallet…");

    if (win.brc100Wallet?.connect) {
      const key = await win.brc100Wallet.connect();

      console.log("BRC-100 Wallet connected, pubkey:", key);
      

      setWallet({
        sign: win.brc100Wallet.sign.bind(win.brc100Wallet),
        pay: win.brc100Wallet.pay?.bind(win.brc100Wallet),
        disconnect: win.brc100Wallet.disconnect?.bind(win.brc100Wallet),
        getTokens: win.brc100Wallet.getTokens?.bind(win.brc100Wallet),
        identityKey: key,
      });

      setPubKey(key);
      setIsConnected(true);
      setLastMessage("Connected to BRC-100 Wallet");

      return;
    }
  } catch (e) {
    console.error("BRC-100 Wallet connection failed:", e);
  }

  // ----------------------------------------------------
  // 4. NONE FOUND
  // ----------------------------------------------------
  setLastMessage("No compatible wallet detected");
  alert(
    "No wallet detected.\nInstall BSV Desktop Wallet or Metanet Client.\n\nBSV Desktop Wallet: https://desktop.bsvb.tech"
  );
};


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