import React, { useState } from "react";
import { useWallet } from "../../context/WalletContext";

interface LoginModalProps {
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const { connectWallet } = useWallet();
  const [mode, setMode] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Login</h3>

        {!mode && (
          <button
            onClick={() => {
              setMode("wallet");
              connectWallet();
              onClose();
            }}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition duration-200"
          >
            Connect with BSV Wallet
          </button>
        )}

        <div className="mt-4 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
