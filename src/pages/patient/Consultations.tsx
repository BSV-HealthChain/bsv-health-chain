import React, { useState } from "react";
import { useWallet } from "../../context/WalletContext";
import { sendConsultationRequest } from "../../services/patientService";

const Consultations: React.FC = () => {
  const { pubKey, connectWallet } = useWallet();
  const [form, setForm] = useState({ providerId: "", message: "" });
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubKey) return;

    try {
      const data = await sendConsultationRequest(
        pubKey,
        form.providerId,
        form.message
      );

      setSuccess(`Consultation request sent! ID: ${data.requestId}`);
      setForm({ providerId: "", message: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to send consultation request.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-xl mt-6">
      {!pubKey ? (
        <button
          onClick={() => connectWallet()}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded transition"
        >
          Connect Wallet
        </button>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-4 text-center">
            Consultation Request
          </h1>

          {success && (
            <p className="text-green-600 mb-4 text-center font-medium">
              {success}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Provider ID"
              value={form.providerId}
              onChange={(e) =>
                setForm({ ...form, providerId: e.target.value })
              }
              required
            />

            <textarea
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Brief message"
              value={form.message}
              onChange={(e) =>
                setForm({ ...form, message: e.target.value })
              }
              rows={4}
              required
            />

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded transition"
            >
              Submit Request
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default Consultations;
