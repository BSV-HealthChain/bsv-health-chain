import React from "react";
import { useWallet } from "../context/WalletContext";

const WalletButton: React.FC = () => {
  const { pubKey, connectWallet, disconnect, isConnected } = useWallet();

  return (
    <div>
      {isConnected ? (
        <>
          <span>Connected: {pubKey}</span>
          <button onClick={disconnect}>Disconnect</button>
        </>
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
>
  Connect Wallet
</button>

      )}
    </div>
  );
};

export default WalletButton;
