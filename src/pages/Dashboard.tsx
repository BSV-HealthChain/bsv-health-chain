import React, { useState } from "react";
import { useWallet } from "../context/WalletContext";
import FhirForm, { type FhirFormData } from "../components/FhirForm";
import { sha256Hex } from "../utils/hash";
import ProvidersPanel from "../components/ProvidersPanel";
import LookupPanel from "../components/LookupPanel";
import StatusPanel from "../components/StatusPanel";

const SATOSHIS_TO_PAY = 10;
const RECEIVING_ADDRESS = "14rUsTzH1ecaiV2soyVJCsk95SS7L757sY";

const Dashboard: React.FC = () => {
  const { pubKey, connect, wallet, lastMessage, setLastMessage } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (data: FhirFormData) => {
    if (!pubKey || !wallet) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      setIsSubmitting(true);

      const confirmed = window.confirm(
        `Submit requires paying ${SATOSHIS_TO_PAY} satoshis. Continue?`
      );

      if (!confirmed) {
        setLastMessage("Payment cancelled");
        setIsSubmitting(false);
        return;
      }

      setLastMessage("Requesting payment from wallet...");

      const { txid, rawTx } = await wallet.pay({
        satoshis: SATOSHIS_TO_PAY,
        to: RECEIVING_ADDRESS,
      });

      const formString = JSON.stringify(data);
      const formHash = sha256Hex(formString);

      setLastMessage("Broadcasting & submitting data...");

      await fetch("/api/fhir-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pubKey,
          txid,
          rawTx,
          formHash,
          formData: data,
        }),
      });

      setLastMessage(`Submitted successfully! TXID: ${txid}`);
    } catch (err) {
      console.error(err);
      setLastMessage("Submission failed: " + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-8">
      {/* Wallet connect button */}
      {!pubKey && (
        <div className="max-w-[1200px] mx-auto mb-6 px-4">
          <button
            onClick={connect}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition"
          >
            Connect Wallet
          </button>
        </div>
      )}

      {/* Last message */}
      {lastMessage && (
        <div className="max-w-[1200px] mx-auto px-4 mb-6 text-center text-black font-medium">
          {lastMessage}
        </div>
      )}

      {/* Main dashboard container */}
      <div className="max-w-[1200px] mx-auto px-4 flex flex-col gap-6">
        {/* Top Panels: FHIR form, Lookup, Providers */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: FHIR Form */}
          <div className="lg:w-1/3 bg-white p-6 rounded-2xl shadow-xl">
            <FhirForm onSubmit={handleFormSubmit} disabled={isSubmitting} />
          </div>

          {/* Center: Lookup / other panels */}
          <div className="lg:w-1/3 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-xl">
              <LookupPanel />
            </div>
          </div>

          {/* Right: Providers Panel */}
          <div className="lg:w-1/3 bg-white p-6 rounded-2xl shadow-xl">
            <ProvidersPanel />
          </div>
        </div>

        {/* Bottom: Status Panel */}
        <div className="bg-black text-white p-4 rounded-2xl shadow-xl">
          <StatusPanel txStatus={null} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
