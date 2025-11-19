import React, { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import ErrorModal from "./ErrorModal";

export interface FhirFormData {
  patientName: string;
  age: string;
  gender: string;
  diagnosis: string;
  notes: string;
}

export interface FhirFormProps {
  onSubmit?: (data: FhirFormData) => void;
  disabled?: boolean;
}

const FhirForm: React.FC<FhirFormProps> = ({ onSubmit, disabled = false }) => {
  const [formData, setFormData] = useState<FhirFormData>({
    patientName: "",
    age: "",
    gender: "",
    diagnosis: "",
    notes: "",
  });

  const [error, setError] = useState<string>("");

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = (): string => {
    if (!formData.patientName.trim()) return "Patient name is required.";
    if (!formData.age || isNaN(Number(formData.age))) return "Valid age is required.";
    if (!formData.gender.trim()) return "Gender is required.";
    if (!formData.diagnosis.trim()) return "Diagnosis is required.";
    return "";
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (onSubmit) onSubmit(formData);

    setFormData({
      patientName: "",
      age: "",
      gender: "",
      diagnosis: "",
      notes: "",
    });
  };

  return (
    <>
      {error && <ErrorModal message={error} onClose={() => setError("")} />}

      <form
        onSubmit={handleSubmit}
        className="
          bg-white shadow-xl rounded-2xl p-6 
          max-w-md w-full mx-auto
          border border-gray-200
          space-y-5
        "
      >
        <h2 className="text-2xl font-bold text-black text-center mb-4">
          FHIR Patient Record
        </h2>

        {/* Patient Name */}
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium text-black">Patient Name</label>
          <input
            type="text"
            name="patientName"
            value={formData.patientName}
            onChange={handleChange}
            placeholder="Enter full name"
            className="
              w-full px-4 py-2 border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-blue-400 focus:border-blue-400
              text-black placeholder-gray-400
            "
            required
          />
        </div>

        {/* Age */}
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium text-black">Age</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="Age"
            className="
              w-full px-4 py-2 border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-blue-400 focus:border-blue-400
              text-black placeholder-gray-400
            "
            required
          />
        </div>

        {/* Gender */}
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium text-black">Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="
              w-full px-4 py-2 border border-gray-300 rounded-lg 
              bg-white text-black
              focus:ring-2 focus:ring-blue-400 focus:border-blue-400
            "
            required
          >
            <option value="">Select gender…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Diagnosis */}
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium text-black">Diagnosis</label>
          <input
            type="text"
            name="diagnosis"
            value={formData.diagnosis}
            onChange={handleChange}
            placeholder="Diagnosis or condition"
            className="
              w-full px-4 py-2 border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-blue-400 focus:border-blue-400
              text-black placeholder-gray-400
            "
            required
          />
        </div>

        {/* Notes */}
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium text-black">Additional Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Optional notes..."
            rows={4}
            className="
              w-full px-4 py-2 border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-blue-400 focus:border-blue-400
              text-black placeholder-gray-400
            "
          ></textarea>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={disabled}
          className="
            w-full py-3 rounded-lg font-semibold
            bg-blue-500 hover:bg-blue-600 text-white
            disabled:opacity-60 disabled:cursor-not-allowed
            transition
          "
        >
          {disabled ? "Submitting…" : "Submit"}
        </button>
      </form>
    </>
  );
};

export default FhirForm;
