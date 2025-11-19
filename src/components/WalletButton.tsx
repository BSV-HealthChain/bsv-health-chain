import React from "react";
import { useWallet } from "../context/WalletContext";

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
    <div className="w-full flex justify-end p-4">
      <button
        onClick={connect}
        className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-md transition"
      >
        Connect Wallet
      </button>
      {lastMessage && (
        <div className="text-center text-gray-500 text-sm mb-6">{lastMessage}</div>
      )}
    </div>
  );
};

export default WalletButton;
