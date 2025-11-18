import React from "react";

interface TxStatus {
  txid: string;
  status: string;
}

interface StatusPanelProps {
  txStatus: TxStatus | null;
  message?: string | null;
  loading?: boolean;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ txStatus, message, loading = false }) => {
  return (
    <div style={{ marginTop: 20, padding: 16, border: "1px solid #e5e7eb", borderRadius: 8 }}>
      <h2>Messages & Diagnostics</h2>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>{message || "System idle."}</div>
        <div>{loading ? "Working..." : "Ready"}</div>
      </div>

      <h3 style={{ marginTop: 16 }}>Last Transaction</h3>

      {txStatus ? (
        <div style={{ padding: 12, background: "#f9fafb", borderRadius: 6 }}>
          <p>TXID: {txStatus.txid}</p>
          <p>Status: {txStatus.status}</p>
        </div>
      ) : (
        <p>No TX submitted.</p>
      )}
    </div>
  );
};

export default StatusPanel;
