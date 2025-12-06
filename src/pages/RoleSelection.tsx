import React from "react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

const RoleSelection: React.FC = () => {
  const { setRole } = useUser();
  const navigate = useNavigate();

  const choose = (role: "patient" | "provider") => {
    setRole(role);

    if (role === "patient") {
      navigate("/patient/submit-data"); // Patient dashboard
    } else {
      navigate("/provider?tab=form"); // Provider dashboard
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Select Your Role</h2>

      <button
        onClick={() => choose("patient")}
        className="w-full max-w-xs p-4 mb-4 bg-blue-500 text-white font-semibold rounded-lg shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
      >
        I am a Patient
      </button>

      <button
        onClick={() => choose("provider")}
        className="w-full max-w-xs p-4 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
      >
        I am a Healthcare Provider
      </button>
    </div>
  );
};

export default RoleSelection;
