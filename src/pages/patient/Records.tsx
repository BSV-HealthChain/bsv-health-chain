import React, { useEffect, useState } from "react";
import { useWallet } from "../../context/WalletContext";

const Records: React.FC = () => {
  const { pubKey, connectWallet } = useWallet();
  const [records, setRecords] = useState([]);

  useEffect(() => {
    if (!pubKey) return;
    fetch(`/api/patient/records/${pubKey}`)
      .then(res => res.json())
      .then(data => setRecords(data || []));
  }, [pubKey]);

  return (
    <div className="p-6">
      {!pubKey ? (
        <button
          onClick={connectWallet}
          className="bg-purple-600 text-white px-4 py-2 rounded"
        >
          Connect Wallet
        </button>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-4">Medical Records</h1>

          {records.length === 0 ? (
            <p>No medical records yet.</p>
          ) : (
            <ul className="space-y-4">
              {records.map((rec: any, i) => (
                <li key={i} className="p-4 bg-white rounded shadow">
                  <p><b>Form Hash:</b> {rec.formHash}</p>
                  <p><b>Submitted:</b> {new Date(rec.createdAt).toLocaleString()}</p>
                  <pre className="mt-2 p-2 bg-gray-100 rounded">
                    {JSON.stringify(rec.formData, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default Records;
