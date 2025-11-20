import React from "react";
import { Routes, Route } from "react-router-dom";

import { WalletProvider } from "./context/WalletContext";
import { UserProvider } from "./context/UserContext";

import Home from "./pages/Home";
import RoleSelection from "./pages/RoleSelection";
import PatientDashboard from "./pages/PatientDashboard";
import ProviderDashboard from "./pages/ProvidersDashboard";

const App: React.FC = () => {
  return (
    <WalletProvider>
      <UserProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-6xl bg-white shadow-lg rounded-xl p-6 sm:p-8 md:p-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/select-role" element={<RoleSelection />} />
              <Route path="/patient" element={<PatientDashboard />} />
              <Route path="/provider" element={<ProviderDashboard />} />
            </Routes>
          </div>
        </div>
      </UserProvider>
    </WalletProvider>
  );
};

export default App;

