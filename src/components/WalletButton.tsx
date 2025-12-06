import React from "react";
import { useWallet } from "../context/WalletContext";

const WalletButton: React.FC = () => {
  const { pubKey, connectWallet, disconnect, isConnected } = useWallet();

  return (
    <div className="flex flex-col items-center gap-2">
      {isConnected ? (
        <div className="flex flex-col items-center gap-2">
          <span className="text-green-600 font-medium break-all text-center">
            Connected: {pubKey}
          </span>
          <button
            onClick={disconnect}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={async () => {
            try {
              console.log("Connect wallet button clicked");
              await connectWallet("desktop"); // or omit param to auto-detect
              console.log("connectWallet finished");
            } catch (err) {
              console.error("Wallet connection failed:", err);
              alert("Wallet connection failed. See console for details.");
            }
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default WalletButton;
