import React, { useState } from "react";
import { useWallet } from "../../context/WalletContext";

const Consultations: React.FC = () => {
  const { pubKey, connectWallet } = useWallet();
  const [form, setForm] = useState({ providerId: "", message: "" });
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!pubKey) return;

    const res = await fetch("/api/patient/consultation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, pubKey }),
    });

    const data = await res.json();
setSuccess(`Consultation request sent! ID: ${data.requestId}`);

  };

  return (
    <div className="p-6">
      {!pubKey ? (
        <button
          onClick={() => connectWallet() }
          className="bg-purple-600 text-white px-4 py-2 rounded"
        >
          Connect Wallet
        </button>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-4">Consultation Request</h1>

          {success && <p className="text-green-600 mb-4">{success}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="w-full p-2 border rounded"
              placeholder="Provider ID"
              value={form.providerId}
              onChange={(e) => setForm({ ...form, providerId: e.target.value })}
              required
            />

            <textarea
              className="w-full p-2 border rounded"
              placeholder="Brief message"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />

            <button className="bg-purple-600 text-white px-4 py-2 rounded">
              Submit Request
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default Consultations;
