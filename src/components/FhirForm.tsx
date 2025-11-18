import React, { useState  } from "react";
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

const FhirForm: React.FC<FhirFormProps> = ({ onSubmit, disabled=false}) => {
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

    // Reset form
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
        style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "12px",
          maxWidth: "450px",
          margin: "auto",
          boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "18px" }}>
          FHIR Patient Record
        </h2>

        <label>Patient Name</label>
        <input
          type="text"
          name="patientName"
          value={formData.patientName}
          onChange={handleChange}
          placeholder="Enter full name"
          className="input"
          required
        />

        <label>Age</label>
        <input
          type="number"
          name="age"
          value={formData.age}
          onChange={handleChange}
          placeholder="Age"
          className="input"
          required
        />

        <label>Gender</label>
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="input"
          required
        >
          <option value="">Select gender...</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <label>Diagnosis</label>
        <input
          type="text"
          name="diagnosis"
          value={formData.diagnosis}
          onChange={handleChange}
          placeholder="Diagnosis or condition"
          className="input"
          required
        />

        <label>Additional Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Optional notes..."
          className="input"
          rows={4}
        ></textarea>

        <button
          type="submit"
          style={{
            width: "100%",
            background: "#0d6efd",
            color: "white",
            padding: "10px",
            marginTop: "12px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        disabled={disabled} >
         {disabled ? "Submitting…" : "Submit"}
        </button>
      </form>
    </>
  );
};

export default FhirForm;


