import React, { createContext, useContext, useState } from "react";

export interface WalletAPI {
  connect: () => Promise<{ pubKey: string }>;
  sign?: (txHex: string) => Promise<string>;
  pay: (params: { satoshis: number; to: string }) => Promise<{ txid: string; rawTx: string }>;
  disconnect?: () => void;
}

export interface WalletContextType {
  pubKey: string | null;
  wallet: WalletAPI | null;
  lastMessage: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sign: (unsignedTxHex: string) => Promise<string>;
  authenticate: (pubKey: string, jwt: string) => void;
  setLastMessage: React.Dispatch<React.SetStateAction<string | null>>;
}

const WalletContext = createContext<WalletContextType>({} as WalletContextType);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [pubKey, setPubKey] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletAPI | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  // Disconnect wallet
  const disconnect = () => {
    wallet?.disconnect?.();
    setPubKey(null);
    setWallet(null);
    setLastMessage("Wallet disconnected");
  };

  // Sign transaction
  const sign = async (unsignedTxHex: string): Promise<string> => {
    if (!wallet?.sign) throw new Error("Wallet does not support signing");
    return await wallet.sign(unsignedTxHex);
  };

  // Authenticate with JWT
  const authenticate = (pubKey: string, jwt: string) => {
    localStorage.setItem("bsv_jwt", jwt);
    setPubKey(pubKey);
    setLastMessage("Logged in");
  };

  // Universal connect for multi-wallet
  const connect = async () => {
    setLastMessage("Detecting wallets...");
    try {
      // Example detection logic (replace with your SDKs/providers)
      const BSVDesktop = (window as any).BSVDesktop;
      const HandCash = (window as any).handcash;
      const MoneyButton = (window as any).moneyButton;

      let connectedWallet: WalletAPI | null = null;
      let key: string | null = null;

      if (BSVDesktop?.connect && BSVDesktop?.pay) {
        const result = await BSVDesktop.connect({ app: "BSVHealthChain" });
        key = result.pubKey;
        connectedWallet = {
          connect: BSVDesktop.connect,
          pay: BSVDesktop.pay,
          sign: BSVDesktop.sign,
          disconnect: BSVDesktop.disconnect,
        };
      } else if (HandCash?.connect && HandCash?.pay) {
        const result = await HandCash.connect();
        key = result?.userProfile?.paymail;
        connectedWallet = {
          connect: HandCash.connect,
          pay: HandCash.pay,
        };
      } else if (MoneyButton?.getPaymail && MoneyButton?.pay) {
        const paymail = await MoneyButton.getPaymail();
        key = paymail;
        connectedWallet = {
          connect: MoneyButton.getPaymail,
          pay: MoneyButton.pay,
        };
      } else {
        alert(
          "No BSV wallet detected. Please install BSV Desktop, HandCash, MoneyButton, ElectrumSV, or Metanet Client."
        );
        setLastMessage("No wallet detected");
        return;
      }

      if (key && connectedWallet) {
        setPubKey(key);
        setWallet(connectedWallet);
        setLastMessage("Wallet connected");
      }
    } catch (err) {
      console.error(err);
      setLastMessage("Wallet connection failed");
    }
  };

  return (
    <WalletContext.Provider
      value={{
        pubKey,
        wallet,
        connect,
        disconnect,
        sign,
        authenticate,
        lastMessage,
        setLastMessage,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
