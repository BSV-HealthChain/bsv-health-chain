import React from "react";
import { WalletProvider } from "./context/WalletContext";
import Dashboard from "./pages/Dashboard";

const App: React.FC = () => {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-6xl bg-white shadow-lg rounded-xl p-6 sm:p-8 md:p-10">
          <Dashboard />
        </div>
      </div>
    </WalletProvider>
  );
};

export default App;
