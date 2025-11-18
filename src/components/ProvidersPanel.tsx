import React from "react";

interface Provider {
  id: "hospital" | "clinic" | "pharmacy" | "lab" | "telemed";
  name: string;
  description: string;
}

const ProvidersPanel: React.FC = () => {
  const providers: Provider[] = [
    { id: "hospital", name: "Hospital", description: "General medical care" },
    { id: "clinic", name: "Clinic", description: "Primary care services" },
    { id: "pharmacy", name: "Pharmacy", description: "Medication dispensing" },
    { id: "lab", name: "Lab", description: "Diagnostics & testing" },
    { id: "telemed", name: "Telemedicine", description: "Remote care" },
  ];

  const exec = async (name: Provider["id"]) => {
    try {
      const res = await fetch(`/api/workflows/${name}`, { method: "POST" });
      const body = await res.json();
      alert(`${name} workflow executed: ${body.message}`);
    } catch (e: any) {
      alert(`${name} workflow error: ${e?.message || e}`);
    }
  };

  const workflows: Record<Provider["id"], () => Promise<void>> = {
    hospital: async () => exec("hospital"),
    clinic: async () => exec("clinic"),
    pharmacy: async () => exec("pharmacy"),
    lab: async () => exec("lab"),
    telemed: async () => exec("telemed"),
  };

  return (
    <div style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 8 }}>
      <h2>Healthcare Providers</h2>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {providers.map((p) => (
          <li key={p.id} style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
            <strong>{p.name}</strong>
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>{p.description}</p>
            <button
              onClick={workflows[p.id]}
              style={{ marginTop: 6, padding: "6px 10px", borderRadius: 6, background: "#0ea5e9", color: "white" }}
            >
              Launch Workflow
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProvidersPanel;
