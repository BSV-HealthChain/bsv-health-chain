import React, { useState } from "react";
import { useWallet } from "../context/WalletContext";

type InstitutionType = "hospital" | "clinic" | "pharmacy" | "lab";
type IndividualRole = "doctor" | "nurse" | "pharmacist" | "labScientist" | "telemedicine";

export interface ProviderFormData {
  name: string;
  type: "institution" | "individual";
  institutionType?: InstitutionType;
  individualRole?: IndividualRole;
  email: string;
  phone: string;
  address: string;
  description: string;
  specialty: string
  contact: string

}
interface ProviderFormProps {
  onSubmit: (data: ProviderFormData) => void | Promise<void>;
}
const ProviderForm: React.FC<ProviderFormProps> = () => {
  const { pubKey, connectWallet } = useWallet();
  const [form, setForm] = useState<ProviderFormData>({
    name: "",
    type: "institution",
    institutionType: undefined,
    individualRole: undefined,
    email: "",
    phone: "",
    address: "",
    description: "",
    specialty: "",
contact: ""

  });
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof ProviderFormData, value: any) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubKey) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/provider/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, pubKey }),
      });

      if (!res.ok) throw new Error("Registration failed");

      setSuccess("Provider registered successfully!");
      setLoading(false);
    } catch (err) {
      console.error(err);
      setSuccess("Error: " + (err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl">
      {!pubKey ? (
        <button
          onClick={connectWallet}
          className="w-full py-2 mb-4 bg-green-600 text-white rounded"
        >
          Connect Wallet
        </button>
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-6">Healthcare Provider Registration</h2>
          {success && <p className="text-green-600 mb-4">{success}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1">Name</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block mb-1">Provider Type</label>
              <select
                className="w-full border p-2 rounded"
                value={form.type}
                onChange={(e) => handleChange("type", e.target.value)}
              >
                <option value="institution">Institution</option>
                <option value="individual">Individual</option>
              </select>
            </div>

            {form.type === "institution" && (
              <div>
                <label className="block mb-1">Institution Type</label>
                <select
                  className="w-full border p-2 rounded"
                  value={form.institutionType || ""}
                  onChange={(e) => handleChange("institutionType", e.target.value)}
                  required
                >
                  <option value="">Select type</option>
                  <option value="hospital">Hospital</option>
                  <option value="clinic">Clinic</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="lab">Lab</option>
                </select>
              </div>
            )}

            {form.type === "individual" && (
              <div>
                <label className="block mb-1">Role</label>
                <select
                  className="w-full border p-2 rounded"
                  value={form.individualRole || ""}
                  onChange={(e) => handleChange("individualRole", e.target.value)}
                  required
                >
                  <option value="">Select role</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="pharmacist">Pharmacist</option>
                  <option value="labScientist">Lab Scientist</option>
                  <option value="telemedicine">Telemedicine Practitioner</option>
                </select>
              </div>
            )}

            <div>
              <label className="block mb-1">Email</label>
              <input
                type="email"
                className="w-full border p-2 rounded"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block mb-1">Phone</label>
              <input
                type="tel"
                className="w-full border p-2 rounded"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block mb-1">Address</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block mb-1">Description / Notes</label>
              <textarea
                className="w-full border p-2 rounded"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-green-600 text-white rounded"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ProviderForm;
