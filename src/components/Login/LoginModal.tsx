import React, { useState } from "react";
import { useWallet } from "../../context/walletContext"

interface LoginModalProps {
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const { connect } = useWallet();
  const [mode, setMode] = useState<string | null>(null);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.45)",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "white",
          padding: 16,
          borderRadius: 8,
          width: 420,
        }}
      >
        <h3>Login</h3>

        {!mode && (
          <button
            onClick={() => {
              setMode("wallet");
              connect();
              onClose();
            }}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 6,
              background: "#2563eb",
              color: "white",
            }}
          >
            Connect with BSV Wallet
          </button>
        )}

        <div style={{ marginTop: 12, textAlign: "right" }}>
          <button
            onClick={onClose}
            style={{ padding: "6px 10px", borderRadius: 6 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
