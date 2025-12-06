import { useEffect, useState } from "react";
import { useWallet } from "../context/WalletContext";
import { generateMasterKey, generateAddresses } from "../wallet/hdWallet";
import { getWalletTokenBalances } from "../wallet/tokenBalances";
import { generateWalletBackupPDF } from "../wallet/backupPdf";

const WalletDashboard = () => {
  const { pubKey } = useWallet();
  const [addresses, setAddresses] = useState<string[]>([]);
  const [balances, setBalances] = useState<any[]>([]);

  useEffect(() => {
    if (!pubKey) return;

    const init = async () => {
      const mnemonicEnc = localStorage.getItem("localWallet");
      if (!mnemonicEnc) return;

      const password = prompt("Enter your wallet password to unlock addresses:");
      if (!password) {
        console.warn("Password required");
        return;
      }

      const master = await generateMasterKey(password);
      const addrs = generateAddresses(master, 5);
      setAddresses(addrs.map((a) => a.address));

      const tokenBalances = await getWalletTokenBalances(
        addrs.map((a) => a.address)
      );
      setBalances(tokenBalances);
    };

    init();
  }, [pubKey]);

  if (!pubKey)
    return (
      <p className="text-center text-gray-500 mt-4">
        No wallet connected.
      </p>
    );

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-3xl mx-auto mt-6">
      <h2 className="text-2xl font-bold mb-4 text-center">Wallet Dashboard</h2>

      <button
        className="bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded mb-6 transition"
        onClick={() => generateWalletBackupPDF(pubKey, addresses)}
      >
        Backup Wallet PDF
      </button>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {balances.map((b, i) => (
          <div
            key={i}
            className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200"
          >
            <p className="font-mono break-words">
              <strong>Address:</strong> {b.address}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 text-sm">
              <p>
                <strong>BSV:</strong> {b.total}
              </p>
              <p>
                <strong>Confirmed:</strong> {b.confirmed} sats
              </p>
              <p>
                <strong>Unconfirmed:</strong> {b.unconfirmed} sats
              </p>
              <p>
                <strong>USD:</strong> ${b.USD.toFixed(2)}
              </p>
              <p>
                <strong>EUR:</strong> €{b.EUR.toFixed(2)}
              </p>
              <p>
                <strong>GBP:</strong> £{b.GBP.toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WalletDashboard;
