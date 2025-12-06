import React from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import WalletButton from "../components/WalletButton";
import medicalLogo from "../assets/medical-logo.png"; // Add your logo in src/assets

const Home: React.FC = () => {
  const { isConnected } = useWallet();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isConnected) {
      navigate("/select-role");
    }
  }, [isConnected]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-6 max-w-6xl mx-auto w-full">
        <img src={medicalLogo} alt="Medical Logo" className="h-12 w-auto" />
        <WalletButton />
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 leading-tight mb-6">
          You are the owner of your health record,
          <br />
          protect it.
        </h1>
        <p className="text-lg md:text-xl text-blue-700 max-w-xl">
          zHealth empowers you to securely store, manage, and control access to your medical data with the BSV blockchain.
        </p>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-blue-600 font-medium">
        &copy; {new Date().getFullYear()} zHealth. All rights reserved.
      </footer>
    </div>
  );
};

export default Home;
