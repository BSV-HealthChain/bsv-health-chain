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
        <button onClick={() => connectWallet()}>Connect Wallet</button>
      )}
    </div>
  );
};

export default WalletButton;
