import React, { useState } from "react";
import { useWallet } from "../../context/WalletContext";
import FhirForm from "../../components/FhirForm";
import type { FhirFormData } from "../../components/FhirForm";

import { sha256Hex } from "../../utils/hash";

const SATOSHIS_TO_PAY = 10;
const RECEIVING_ADDRESS = "14rUsTzH1ecaiV2soyVJCsk95SS7L757sY";

const SubmitData: React.FC = () => {
  const { pubKey, wallet, connectWallet, lastMessage, setLastMessage } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (data: FhirFormData) => {
    if (!pubKey || !wallet) {
      alert("Connect wallet first.");
      return;
    }

    try {
      setIsSubmitting(true);

      // PAYMENT
      const { txid, rawTx } = await wallet.pay({
        satoshis: SATOSHIS_TO_PAY,
        to: RECEIVING_ADDRESS
      });

      // HASH
      const formHash = sha256Hex(JSON.stringify(data));

      await fetch("/api/patient/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pubKey, txid, rawTx, formHash, formData: data }),
      });

      setLastMessage("Health data submitted successfully!");
    } catch (err: any) {
      setLastMessage("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      {!pubKey && (
        <button
          onClick={connectWallet}
          className="bg-purple-600 text-white px-4 py-2 rounded"
        >
          Connect Wallet
        </button>
      )}

      {lastMessage && <p className="my-3">{lastMessage}</p>}

      <h1 className="text-2xl font-bold mb-4">Submit Medical Data</h1>

      <FhirForm onSubmit={handleFormSubmit} disabled={isSubmitting} />
    </div>
  );
};

export default SubmitData;
