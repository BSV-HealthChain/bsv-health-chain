import React from "react";
import { Outlet, NavLink, Navigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

const PatientLayout: React.FC = () => {
  const { role } = useUser();

  if (role !== "patient") return <Navigate to="/select-role" />;

  return (
    <div className="p-6 min-h-screen bg-purple-50">
      <nav className="flex flex-wrap gap-2 mb-6">
        {[
          { path: "submit-data", label: "Submit Data" },
          { path: "consultations", label: "Consultations" },
          { path: "providers", label: "Providers" },
          { path: "payments", label: "Payments" },
          { path: "records", label: "Records" },
        ].map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              isActive
                ? "px-4 py-2 bg-purple-600 text-white rounded transition"
                : "px-4 py-2 bg-white border border-gray-300 rounded transition hover:bg-purple-100"
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="bg-white p-6 rounded-2xl shadow-xl">
        <Outlet />
      </div>
    </div>
  );
};

export default PatientLayout;
