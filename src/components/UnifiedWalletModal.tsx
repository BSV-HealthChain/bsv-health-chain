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

  type Mode =
    | "choose-wallet"
    | "menu"
    | "create"
    | "import"
    | "unlock"
    | "create-mnemonic"
    | "import-mnemonic";

  const [mode, setMode] = useState<Mode>("choose-wallet");
  const [password, setPassword] = useState("");
  const [wif, setWif] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [mnemonicLen, setMnemonicLen] = useState<12 | 24>(12);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [balances, setBalances] = useState<Record<string, Record<string, number>>>({});

  // ------------------- Local Wallet Handlers -------------------
  const refreshLocalBalances = async () => {
    const priv = localStorage.getItem("localWalletPrivkey");
    if (!priv) return;
    const addrs = await getLocalWalletAddresses(priv);
    setAddresses(addrs);

    const raw = await getWalletTokenBalances(addrs);
    const map: Record<string, Record<string, number>> = {};
    raw.forEach((item) => {
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
    const pubKey = localStorage.getItem("localWalletPubkey") ?? "";
    exportWalletPDF(mnemonic, pubKey, addresses);
  };

  // ------------------- External Wallet Handler -------------------
  const handleExternalConnect = async () => {
    try {
      const pubKey = await connectWallet();
      if (pubKey) {
        onConnected(pubKey, "external");
      } else {
        alert("Wallet connection failed.");
      }
    } catch (err) {
      console.error("Wallet connection failed:", err);
      alert("Wallet connection failed. See console for details.");
    }
  };

  useEffect(() => {
    if (addresses.length > 0) {
      const interval = setInterval(refreshLocalBalances, 15000);
      return () => clearInterval(interval);
    }
  }, [addresses]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh] shadow-lg">
        {/* ------------------- Unified Wallet Selection ------------------- */}
        {mode === "choose-wallet" && (
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Connect Wallet</h2>
            <button
              className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              onClick={handleExternalConnect}
            >
              Connect BSV Wallet (Desktop / Metanet / BRC-100)
            </button>
            <button
              className="w-full p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              onClick={() => setMode("create")}
            >
              Create Local Wallet (WIF)
            </button>
            <button
              className="w-full p-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition"
              onClick={() => setMode("import")}
            >
              Import Local Wallet (WIF)
            </button>
            <button
              className="w-full p-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition"
              onClick={() => setMode("unlock")}
            >
              Unlock Local Wallet
            </button>
            <button
              className="w-full p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
              onClick={() => setMode("create-mnemonic")}
            >
              Create Mnemonic Wallet
            </button>
            <button
              className="w-full p-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition"
              onClick={() => setMode("import-mnemonic")}
            >
              Import Mnemonic Wallet
            </button>
          </div>
        )}

        {/* ------------------- Local Wallet Flows ------------------- */}
        {mode !== "choose-wallet" && (
          <div className="flex flex-col gap-4">
            <button
              className="text-blue-600 hover:underline font-medium"
              onClick={() => setMode("choose-wallet")}
            >
              ← Back to Wallet Selection
            </button>

            {/* Create / Import / Unlock / Mnemonic flows */}
            {mode === "create" && (
              <>
                <h3 className="text-xl font-semibold text-gray-800">Create Wallet</h3>
                <input
                  type="password"
                  placeholder="Set password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border p-3 w-full mb-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <button
                  className="w-full p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                  onClick={handleCreateWIF}
                >
                  Create
                </button>
              </>
            )}

            {mode === "import" && (
              <>
                <h3 className="text-xl font-semibold text-gray-800">Import Wallet</h3>
                <input
                  placeholder="WIF private key"
                  value={wif}
                  onChange={(e) => setWif(e.target.value)}
                  className="border p-3 w-full mb-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <input
                  type="password"
                  placeholder="Set password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border p-3 w-full mb-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <button
                  className="w-full p-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition"
                  onClick={handleImportWIF}
                >
                  Import
                </button>
              </>
            )}

            {mode === "unlock" && (
              <>
                <h3 className="text-xl font-semibold text-gray-800">Unlock Wallet</h3>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border p-3 w-full mb-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
                <button
                  className="w-full p-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition"
                  onClick={handleUnlock}
                >
                  Unlock
                </button>
              </>
            )}

            {mode === "create-mnemonic" && (
              <>
                <h3 className="text-xl font-bold text-gray-800">Create Mnemonic Wallet</h3>
                <select
                  className="border p-3 w-full mb-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
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
                  className="border p-3 w-full mb-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  onClick={handleCreateMnemonic}
                  className="w-full p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                >
                  Create Wallet
                </button>
              </>
            )}

            {mode === "import-mnemonic" && (
              <>
                <h3 className="text-xl font-bold text-gray-800">Import Seed Phrase</h3>
                <textarea
                  placeholder="Enter 12 or 24 words"
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  className="border p-3 w-full mb-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                  rows={3}
                />
                <input
                  type="password"
                  placeholder="Set password"
                  className="border p-3 w-full mb-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  onClick={handleImportMnemonic}
                  className="w-full p-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition"
                >
                  Import Seed Phrase
                </button>
              </>
            )}

            {/* Show local wallet addresses & balances */}
            {addresses.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-inner overflow-x-auto">
                <h4 className="font-semibold text-gray-800 mb-2">Addresses & Balances</h4>
                <table className="w-full text-sm font-mono border border-gray-200 rounded-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left px-3 py-2">Address</th>
                      {TOKENS.map((token) => (
                        <th key={token} className="px-3 py-2 text-right">{token}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {addresses.map((addr) => (
                      <tr key={addr} className="border-t">
                        <td className="px-3 py-2 break-words">{addr}</td>
                        {TOKENS.map((token) => (
                          <td key={token} className="px-3 py-2 text-right">
                            {balances[addr]?.[token.toLowerCase()] ?? 0}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  className="mt-3 w-full p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                  onClick={handleExportPDF}
                >
                  Export Backup PDF
                </button>
              </div>
            )}
          </div>
        )}

        {/* Close Modal */}
        <button
          onClick={onClose}
          className="mt-6 w-full p-2 text-red-500 underline rounded hover:text-red-600 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default UnifiedWalletModal;
