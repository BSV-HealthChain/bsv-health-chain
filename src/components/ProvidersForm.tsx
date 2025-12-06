import { useState } from "react";

// -----------------------------
// Types for the form
// -----------------------------
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
  specialty: string;
  contact: string;
}

interface ProviderFormProps {
  onSubmit: (data: ProviderFormData) => void | Promise<void>;
}

export const ProviderForm: React.FC<ProviderFormProps> = ({ onSubmit }) => {
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
    contact: "",
  });

  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof ProviderFormData, value: any) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSubmit(form);
      setSuccess("Provider registered successfully!");
    } catch (err) {
      console.error(err);
      setSuccess("Error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Healthcare Provider Registration
      </h2>
      {success && <p className="text-green-600 mb-4 text-center">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-gray-700 mb-1 font-medium">Name</label>
          <input
            type="text"
            className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />
        </div>

        {/* Provider Type */}
        <div>
          <label className="block text-gray-700 mb-1 font-medium">Provider Type</label>
          <select
            className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
            value={form.type}
            onChange={(e) => handleChange("type", e.target.value)}
          >
            <option value="institution">Institution</option>
            <option value="individual">Individual</option>
          </select>
        </div>

        {/* Institution Type */}
        {form.type === "institution" && (
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Institution Type</label>
            <select
              className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
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

        {/* Individual Role */}
        {form.type === "individual" && (
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Role</label>
            <select
              className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
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

        {/* Other fields */}
        <div>
          <label className="block text-gray-700 mb-1 font-medium">Email</label>
          <input
            type="email"
            className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1 font-medium">Phone</label>
          <input
            type="tel"
            className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1 font-medium">Address</label>
          <input
            type="text"
            className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1 font-medium">Description / Notes</label>
          <textarea
            className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
};
