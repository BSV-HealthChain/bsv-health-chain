import React from "react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

const RoleSelection: React.FC = () => {
  const { setRole } = useUser();
  const navigate = useNavigate();

  const choose = (role: "patient" | "provider") => {
    setRole(role);
    navigate(role === "patient" ? "/patient" : "/provider");
  };

  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl mb-6">Select Your Role</h2>

      <button
        onClick={() => choose("patient")}
        className="block w-full p-4 mb-4 bg-blue-500 text-white rounded"
      >
        I am a Patient
      </button>

      <button
        onClick={() => choose("provider")}
        className="block w-full p-4 bg-green-600 text-white rounded"
      >
        I am a Healthcare Provider
      </button>
    </div>
  );
};

export default RoleSelection;
