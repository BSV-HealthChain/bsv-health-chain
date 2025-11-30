import React, { useState } from "react";
import { useWallet } from "../context/WalletContext";
import LookupPanel from "../components/LookupPanel";
import StatusPanel from "../components/StatusPanel";
import { ProviderForm } from "../components/ProvidersForm";
import ConsultationsTab from "../components/tabs/ConsultationsTab";
import RecordsTab from "../components/tabs/RecordsTabs";
import type { ProviderFormData } from "../components/ProvidersForm";
import { registerProvider } from "../services/providerService";

const ProviderDashboard: React.FC = () => {
  const { pubKey, connectWallet, lastMessage, setLastMessage } = useWallet();

  // Track which tab is active
  const [activeTab, setActiveTab] = useState<"form" | "lookup" | "consultations" | "records">("form");

  // Track if provider has submitted the form
  const [providerRegistered, setProviderRegistered] = useState(false);

  const handleProviderSubmit = async (data: ProviderFormData) => {
    if (!pubKey) {
      alert("Please connect your wallet first.");
      return;
    }
    try {
      setLastMessage("Submitting provider info...");
      const result = await registerProvider({ ...data, pubKey });
      if (result.error) {
        setLastMessage("Failed to submit: " + result.error);
      } else {
        setLastMessage("Provider information submitted successfully!");
        setProviderRegistered(true);
        setActiveTab("lookup"); // switch to lookup after submission
      }
    } catch (err) {
      setLastMessage("Submission failed: " + (err as Error).message);
    }
  };

  // If wallet not connected, show connect button only
  if (!pubKey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button
          onClick={() => connectWallet() }
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 py-8">
      {lastMessage && (
        <div className="max-w-[1200px] mx-auto px-4 mb-6 text-center text-black font-medium">
          {lastMessage}
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-4 flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-green-700">Healthcare Provider Dashboard</h1>

        {/* Tabs: Only show after provider registers */}
        {providerRegistered && (
          <div className="flex gap-3 mb-6">
            {["lookup", "consultations", "records"].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 rounded ${
                  activeTab === tab ? "bg-green-600 text-white" : "bg-white border"
                }`}
                onClick={() => setActiveTab(tab as typeof activeTab)}
              >
                {tab === "lookup"
                  ? "Patient Lookup"
                  : tab === "consultations"
                  ? "Consultations"
                  : "Patient Records"}
              </button>
            ))}
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl shadow-xl">
          {/* Show ProviderForm if not registered or active tab is form */}
          {!providerRegistered || activeTab === "form" ? (
            <ProviderForm onSubmit={handleProviderSubmit} />
          ) : activeTab === "lookup" ? (
            <LookupPanel />
          ) : activeTab === "consultations" ? (
            <ConsultationsTab pubKey={pubKey} />
          ) : (
            <RecordsTab pubKey={pubKey} />
          )}
        </div>

        <div className="bg-black text-white p-4 rounded-2xl shadow-xl">
          <StatusPanel txStatus={null} />
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
