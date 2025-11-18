import React from "react";

interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

export default function ErrorModal({ message, onClose }: ErrorModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "25px",
          borderRadius: "10px",
          width: "350px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
          textAlign: "center",
        }}
      >
        <h3 style={{ color: "red", marginBottom: "10px" }}>Error</h3>
        <p>{message}</p>

        <button
          onClick={onClose}
          style={{
            marginTop: "15px",
            padding: "8px 15px",
            borderRadius: "6px",
            background: "#dc3545",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
