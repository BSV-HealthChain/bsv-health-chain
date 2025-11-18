import React from "react";
import { useWallet } from "../context/walletContext";

const WalletButton: React.FC = () => {
  const { pubKey, connect, disconnect, lastMessage } = useWallet();

  return pubKey ? (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <div style={{ fontSize: 13 }}>
        Wallet: <strong>{pubKey}</strong>
      </div>
      <button
        onClick={disconnect}
        style={{
          background: "#e53e3e",
          color: "white",
          padding: "6px 10px",
          borderRadius: 6,
        }}
      >
        Disconnect
      </button>
    </div>
  ) : (
    <div>
      <button
        onClick={connect}
        style={{
          background: "#2563eb",
          color: "white",
          padding: "8px 12px",
          borderRadius: 6,
        }}
      >
        Connect Wallet
      </button>
      {lastMessage && (
        <div style={{ marginTop: 6, fontSize: 12 }}>{lastMessage}</div>
      )}
    </div>
  );
};

export default WalletButton;
