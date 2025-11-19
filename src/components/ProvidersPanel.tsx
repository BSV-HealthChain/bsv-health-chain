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
    <div className="p-6 rounded-2xl bg-white shadow-xl border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Healthcare Providers
      </h2>

      <ul className="space-y-5">
        {providers.map((p) => (
          <li
            key={p.id}
            className="p-4 rounded-xl border border-gray-200 hover:shadow-lg transition flex flex-col justify-between"
          >
            <div>
              <strong className="text-gray-900 text-lg">{p.name}</strong>
              <p className="text-gray-500 mt-1">{p.description}</p>
            </div>
            <button
              onClick={workflows[p.id]}
              className="mt-3 self-start px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium transition"
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
