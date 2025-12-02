// src/components/UnifiedWalletModal.tsx
import React, { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import {
  createLocalWallet,
  importLocalWallet,
  loadLocalWallet,
  getLocalWalletAddresses,
  exportWalletPDF,
  createMnemonicWallet,
  importMnemonicWallet,
} from "../wallet/localWallet";
import { getWalletTokenBalances } from "../wallet/tokenBalances";

interface UnifiedWalletModalProps {
  onClose: () => void;
  onConnected: (pubKey: string, type: "external" | "local") => void;
}

const TOKENS = ["BSV", "SATS", "USD", "EUR", "GBP"] as const;

const UnifiedWalletModal: React.FC<UnifiedWalletModalProps> = ({
  onClose,
  onConnected,
}) => {
  const { connectWallet } = useWallet();
  const [tab, setTab] = useState<"external" | "local">("external");

  // Local wallet states
  type Mode =
    | "menu"
    | "create"
    | "import"
    | "unlock"
    | "create-mnemonic"
    | "import-mnemonic";
  const [mode, setMode] = useState<Mode>("menu");
  const [password, setPassword] = useState("");
  const [wif, setWif] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [mnemonicLen, setMnemonicLen] = useState<12 | 24>(12);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [balances, setBalances] = useState<Record<string, Record<string, number>>>({});

  // ------------------- Local Wallet Handlers -------------------
  const refreshLocalBalances = async () => {
    const priv = localStorage.getItem("localWalletPrivkey");
if (!priv) return; // wallet not unlocked yet
const addrs = await getLocalWalletAddresses(priv);
    setAddresses(addrs);
    const raw = await getWalletTokenBalances(addrs);

// Convert array → dictionary
const map: Record<string, Record<string, number>> = {};

raw.forEach(item => {
  const addr = item.address;

  map[addr] = {
    bsv: Number(item.confirmed) || 0,
    sats: Number(item.total) || 0,
    usd: item.USD ?? 0,
    eur: item.EUR ?? 0,
    gbp: item.GBP ?? 0,
  };
});

setBalances(map);

  };

  const handleCreateWIF = async () => {
    const { pubkey } = await createLocalWallet(password);
    await refreshLocalBalances();
    onConnected(pubkey, "local");
  };

  const handleImportWIF = async () => {
    const { pubkey } = await importLocalWallet(wif);
    await refreshLocalBalances();
    onConnected(pubkey, "local");
  };

  const handleUnlock = async () => {
    try {
      await loadLocalWallet(password);
      const pub = localStorage.getItem("localWalletPubkey")!;
      await refreshLocalBalances();
      onConnected(pub, "local");
    } catch {
      alert("Wrong password");
    }
  };

  const handleCreateMnemonic = async () => {
    const { pubkey, mnemonic } = await createMnemonicWallet(password, mnemonicLen);
    setMnemonic(mnemonic);
    await refreshLocalBalances();
    alert("Write down your seed:\n\n" + mnemonic);
    onConnected(pubkey, "local");
  };

  const handleImportMnemonic = async () => {
    const { pubkey } = await importMnemonicWallet(mnemonic.trim(), password);
    await refreshLocalBalances();
    onConnected(pubkey, "local");
  };

  const handleExportPDF = () => {
  const [pubKey] = useState<string>("");
    exportWalletPDF( mnemonic, pubKey, addresses );
  };

  // ------------------- External Wallet Handler -------------------
  const handleExternalConnect = async () => {
  try {
    const pubKey = await connectWallet(); // WalletContext handles providers internally
    if (pubKey) {
      onConnected(pubKey, "external");
    } else {
      console.error("No public key returned from connectWallet");
      alert("Wallet connection failed. Check console for details.");
    }
  } catch (err) {
    console.error("Failed to connect wallet:", err);
    alert("Wallet connection failed. See console for details.");
  }
};




  // ------------------- Auto-refresh balances every 15s -------------------
  useEffect(() => {
    if (addresses.length > 0) {
      const interval = setInterval(refreshLocalBalances, 15000);
      return () => clearInterval(interval);
    }
  }, [addresses]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
        {/* Tabs */}
        <div className="flex justify-center mb-4">
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold ${
              tab === "external" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setTab("external")}
          >
            External Wallet
          </button>
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold ${
              tab === "local" ? "bg-green-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setTab("local")}
          >
            Local Wallet
          </button>
        </div>

        {/* Tab Content */}
        {tab === "external" && (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold mb-2">Connect External Wallet</h2>
            <button
              onClick={handleExternalConnect}
              className="w-full p-3 bg-blue-600 text-white rounded"
            >
              Connect BSV Wallet (Desktop / Metanet / BRC-100)
            </button>
          </div>
        )}

        {tab === "local" && (
          <div className="flex flex-col gap-3">
            {/* Menu */}
            {mode === "menu" && (
              <>
                <h2 className="text-lg font-bold mb-2">Local Wallet</h2>
                <button
                  className="w-full p-3 bg-green-600 text-white rounded"
                  onClick={() => setMode("create")}
                >
                  Create Wallet (WIF)
                </button>
                <button
                  className="w-full p-3 bg-yellow-600 text-white rounded"
                  onClick={() => setMode("import")}
                >
                  Import Wallet (WIF)
                </button>
                <button
                  className="w-full p-3 bg-purple-600 text-white rounded"
                  onClick={() => setMode("create-mnemonic")}
                >
                  Create Mnemonic Wallet
                </button>
                <button
                  className="w-full p-3 bg-orange-600 text-white rounded"
                  onClick={() => setMode("import-mnemonic")}
                >
                  Import Mnemonic Wallet
                </button>
                <button
                  className="w-full p-3 bg-gray-700 text-white rounded"
                  onClick={() => setMode("unlock")}
                >
                  Unlock Existing Wallet
                </button>
              </>
            )}

            {/* Create / Import / Unlock WIF */}
            {mode === "create" && (
              <>
                <h3 className="text-lg font-semibold">Create Wallet</h3>
                <input
                  type="password"
                  placeholder="Set password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border p-2 w-full mb-3 rounded"
                />
                <button
                  className="w-full p-3 bg-green-600 text-white rounded"
                  onClick={handleCreateWIF}
                >
                  Create
                </button>
              </>
            )}

            {mode === "import" && (
              <>
                <h3 className="text-lg font-semibold">Import Wallet</h3>
                <input
                  placeholder="WIF private key"
                  value={wif}
                  onChange={(e) => setWif(e.target.value)}
                  className="border p-2 w-full mb-2 rounded"
                />
                <input
                  type="password"
                  placeholder="Set password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border p-2 w-full mb-3 rounded"
                />
                <button
                  className="w-full p-3 bg-yellow-600 text-white rounded"
                  onClick={handleImportWIF}
                >
                  Import
                </button>
              </>
            )}

            {mode === "unlock" && (
              <>
                <h3 className="text-lg font-semibold">Unlock Wallet</h3>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border p-2 w-full mb-3 rounded"
                />
                <button
                  className="w-full p-3 bg-gray-700 text-white rounded"
                  onClick={handleUnlock}
                >
                  Unlock
                </button>
              </>
            )}

            {/* Mnemonic Flows */}
            {mode === "create-mnemonic" && (
              <>
                <h3 className="text-lg font-bold mb-3">Create Mnemonic Wallet</h3>
                <select
                  className="border p-2 w-full mb-3"
                  onChange={(e) =>
                    setMnemonicLen(Number(e.target.value) as 12 | 24)
                  }
                  value={mnemonicLen}
                >
                  <option value={12}>12 words</option>
                  <option value={24}>24 words</option>
                </select>
                <input
                  type="password"
                  placeholder="Set wallet password"
                  className="border p-2 w-full mb-3 rounded"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  onClick={handleCreateMnemonic}
                  className="bg-purple-600 text-white p-3 rounded w-full"
                >
                  Create Wallet
                </button>
              </>
            )}

            {mode === "import-mnemonic" && (
              <>
                <h3 className="text-lg font-bold mb-3">Import Seed Phrase</h3>
                <textarea
                  placeholder="Enter 12 or 24 words"
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  className="border p-2 w-full mb-3 rounded"
                  rows={3}
                />
                <input
                  type="password"
                  placeholder="Set password"
                  className="border p-2 w-full mb-3 rounded"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  onClick={handleImportMnemonic}
                  className="bg-orange-600 text-white p-3 rounded w-full"
                >
                  Import Seed Phrase
                </button>
              </>
            )}

            {/* Show local wallet addresses & multi-token balances */}
            {addresses.length > 0 && (
              <div className="mt-4 p-3 bg-gray-100 rounded overflow-x-auto">
                <h4 className="font-semibold mb-2">Addresses & Balances</h4>
                <table className="w-full text-sm font-mono border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left px-2 py-1">Address</th>
                      {TOKENS.map((token) => (
                        <th key={token} className="px-2 py-1 text-right">
                          {token}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {addresses.map((addr) => (
                      <tr key={addr} className="border-b">
                        <td className="px-2 py-1 break-words">{addr}</td>
                        {TOKENS.map((token) => (
                          <td key={token} className="px-2 py-1 text-right">
                            {balances[addr]?.[token.toLowerCase()] ?? 0}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  className="mt-2 p-2 bg-blue-500 text-white rounded w-full"
                  onClick={handleExportPDF}
                >
                  Export Backup PDF
                </button>
              </div>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full p-2 text-red-500 underline rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default UnifiedWalletModal;
