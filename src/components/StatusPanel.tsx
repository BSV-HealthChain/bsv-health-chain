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
    <div className="mt-6 p-6 border border-gray-200 rounded-2xl bg-white shadow-sm max-w-md mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Messages & Diagnostics</h2>

      <div className="flex justify-between items-center mb-4">
        <div className="text-gray-700">{message || "System idle."}</div>
        <div className="text-gray-500 font-medium">{loading ? "Working..." : "Ready"}</div>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-2">Last Transaction</h3>

      {txStatus ? (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-gray-700 break-words"><span className="font-medium">TXID:</span> {txStatus.txid}</p>
          <p className="text-gray-700"><span className="font-medium">Status:</span> {txStatus.status}</p>
        </div>
      ) : (
        <p className="text-gray-500">No TX submitted.</p>
      )}
    </div>
  );
};

export default StatusPanel;
