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
    <div className="p-6 bg-purple-50 min-h-screen">
      {!pubKey ? (
        <button
          onClick={() => connectWallet()}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
        >
          Connect Wallet
        </button>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-6 text-purple-800">
            Medical Records
          </h1>

          {records.length === 0 ? (
            <p className="text-gray-600">No medical records yet.</p>
          ) : (
            <ul className="space-y-4">
              {records.map((rec: any, i) => (
                <li
                  key={i}
                  className="p-4 bg-white rounded-2xl shadow hover:shadow-lg transition"
                >
                  <p className="font-semibold">
                    <span className="text-gray-700">Form Hash:</span> {rec.formHash}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold">Submitted:</span>{" "}
                    {new Date(rec.createdAt).toLocaleString()}
                  </p>
                  <pre className="mt-3 p-3 bg-gray-100 rounded-lg overflow-x-auto text-sm">
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
