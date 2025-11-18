import React, { useState } from "react";
import { useWallet } from "../context/walletContext";
import FhirForm, { type FhirFormData } from "../components/FhirForm";
import { sha256Hex } from "../utils/hash";
import ProvidersPanel from "../components/ProvidersPanel";
import LookupPanel from "../components/LookupPanel";
import StatusPanel from "../components/StatusPanel";

const SATOSHIS_TO_PAY = 10;
const RECEIVING_ADDRESS = "your_receiving_address_here"; // TODO: update

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

      // 1️⃣ Wallet payment - production-ready
      const { txid, rawTx } = await wallet.pay({
        satoshis: SATOSHIS_TO_PAY,
        to: RECEIVING_ADDRESS,
      });

      // 2️⃣ Hash the form data
      const formString = JSON.stringify(data);
      const formHash = sha256Hex(formString);

      setLastMessage("Broadcasting & submitting data...");

      // 3️⃣ Send to backend for storage/BOP/Overlay
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
    <div>
      {!pubKey && (
        <button onClick={connect} style={{ padding: 8, marginBottom: 16 }}>
          Connect Wallet
        </button>
      )}

      {lastMessage && <p>{lastMessage}</p>}

      <FhirForm onSubmit={handleFormSubmit} disabled={isSubmitting} />
      <ProvidersPanel />
      <LookupPanel />
      <StatusPanel txStatus={null} />
    </div>
  );
};

export default Dashboard;
