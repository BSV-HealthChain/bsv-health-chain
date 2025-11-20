import React, { useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import { useNavigate } from "react-router-dom";
import WalletButton from "../components/WalletButton";

const Home: React.FC = () => {
  const { isConnected } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (isConnected) {
      navigate("/select-role");
    }
  }, [isConnected]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-xl mb-4">BSV HealthChain</h1>
      <WalletButton />
    </div>
  );
};

export default Home;
