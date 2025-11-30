import  { useEffect, useState } from "react";
import { useWallet } from "../context/WalletContext";
import { generateMasterKey, generateAddresses } from "../wallet/hdWallet";
import { getWalletTokenBalances } from "../wallet/tokenBalances";
import { generateWalletBackupPDF } from "../wallet/backupPdf";

const WalletDashboard = () => {
  const { pubKey} = useWallet();
  const [addresses, setAddresses] = useState<string[]>([]);
  const [balances, setBalances] = useState<any[]>([]);

  useEffect(() => {
  if (!pubKey) return;

  const init = async () => {
    const mnemonicEnc = localStorage.getItem("localWallet");
    if (!mnemonicEnc) return;

    // Ask user for password (since we don't store it in context)
    const password = prompt("Enter your wallet password to unlock addresses:");
    if (!password) {
      console.warn("Password required");
      return;
    }

    const master = await generateMasterKey(password); // Unlock master key
    const addrs = generateAddresses(master, 5);
    setAddresses(addrs.map(a => a.address));

    const tokenBalances = await getWalletTokenBalances(addrs.map(a => a.address));
    setBalances(tokenBalances);
  };

  init();
}, [pubKey]);


  if (!pubKey) return <p>No wallet connected.</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Wallet Dashboard</h2>

      <button
        className="bg-green-500 text-white p-2 rounded mb-4"
        onClick={() => generateWalletBackupPDF(pubKey, addresses)}
      >
        Backup Wallet PDF
      </button>

      {balances.map((b, i) => (
        <div key={i} className="bg-gray-100 p-3 rounded mb-3">
          <p><strong>Address:</strong> {b.address}</p>
          <p>BSV: {b.total}</p>
          <p>Confirmed: {b.confirmed} sats</p>
          <p>Unconfirmed: {b.unconfirmed} sats</p>
          <p>USD: ${b.USD.toFixed(2)}</p>
          <p>EUR: €{b.EUR.toFixed(2)}</p>
          <p>GBP: £{b.GBP.toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
};

export default WalletDashboard;
