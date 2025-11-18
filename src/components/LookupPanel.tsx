import { useState } from "react";
import { useWallet } from "../context/walletContext";

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

      setResult({ overlay, full }); // <-- cleanly ends here
    } catch (e: any) {
      setLastMessage?.(e.message || "Lookup error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 8 }}>
      <h2>Patient Records Lookup</h2>

      <input
        placeholder="patient-12345"
        value={patientId}
        onChange={(e) => setPatientId(e.target.value)}
        style={{ width: "100%", padding: 8, borderRadius: 6, marginBottom: 12 }}
      />

      <button
        onClick={lookup}
        disabled={busy}
        style={{ padding: "8px 12px", background: "#4f46e5", color: "white", borderRadius: 6 }}
      >
        Lookup Records
      </button>

      {result ? (
        <pre style={{ marginTop: 12, background: "#000", color: "#fff", padding: 12, borderRadius: 6 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : (
        <p>No results yet.</p>
      )}
    </div>
  );
}
