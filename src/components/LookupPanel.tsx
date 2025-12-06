import { useState } from "react";
import { useWallet } from "../context/WalletContext";

interface LookupResult {
  overlay: any;
  full: any;
}

export default function LookupPanel() {
  const [patientId, setPatientId] = useState<string>("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  const { setLastMessage } = useWallet();

  async function lookup() {
    if (!patientId) {
      setLastMessage?.("Enter patient ID");
      return;
    }

    setBusy(true);
    setLastMessage?.(null);

    try {
      const resOverlay = await fetch(`/api/overlay/lookup-utxos/${patientId}`);
      const overlay = resOverlay.ok ? await resOverlay.json() : null;

      const resFull = await fetch(`/api/lookup/${patientId}`);
      const full = resFull.ok ? await resFull.json() : null;

      setResult({ overlay, full });
    } catch (e: any) {
      setLastMessage?.(e.message || "Lookup error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 border border-gray-300 rounded-xl bg-white shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Patient Records Lookup</h2>

      <input
        placeholder="patient-12345"
        value={patientId}
        onChange={(e) => setPatientId(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 placeholder-gray-400"
      />

      <button
        onClick={lookup}
        disabled={busy}
        className="w-full py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy ? "Looking up…" : "Lookup Records"}
      </button>

      {result ? (
        <pre className="mt-4 bg-gray-900 text-white p-4 rounded-lg overflow-x-auto text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : (
        <p className="mt-4 text-gray-500 text-center">No results yet.</p>
      )}
    </div>
  );
}
