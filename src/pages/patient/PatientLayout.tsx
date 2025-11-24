import React from "react";
import { Outlet, NavLink, Navigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

const PatientLayout: React.FC = () => {
  const { role } = useUser();
  if (role !== "patient") return <Navigate to="/select-role" />;
   return <Outlet />;

  return (
    <div className="p-6 min-h-screen bg-purple-50">
      <nav className="flex gap-4 mb-6">
        <NavLink
          to="submit-data"
          className={({ isActive }) =>
            isActive
              ? "px-4 py-2 bg-purple-600 text-white rounded"
              : "px-4 py-2 bg-white border rounded"
          }
        >
          Submit Data
        </NavLink>
        <NavLink
          to="consultations"
          className={({ isActive }) =>
            isActive
              ? "px-4 py-2 bg-purple-600 text-white rounded"
              : "px-4 py-2 bg-white border rounded"
          }
        >
          Consultations
        </NavLink>
        <NavLink
          to="providers"
          className={({ isActive }) =>
            isActive
              ? "px-4 py-2 bg-purple-600 text-white rounded"
              : "px-4 py-2 bg-white border rounded"
          }
        >
          Providers
        </NavLink>
        <NavLink
          to="payments"
          className={({ isActive }) =>
            isActive
              ? "px-4 py-2 bg-purple-600 text-white rounded"
              : "px-4 py-2 bg-white border rounded"
          }
        >
          Payments
        </NavLink>
        <NavLink
          to="records"
          className={({ isActive }) =>
            isActive
              ? "px-4 py-2 bg-purple-600 text-white rounded"
              : "px-4 py-2 bg-white border rounded"
          }
        >
          Records
        </NavLink>
      </nav>

      <div className="bg-white p-6 rounded-2xl shadow-xl">
        <Outlet />
      </div>
    </div>
  );
};

export default PatientLayout;
