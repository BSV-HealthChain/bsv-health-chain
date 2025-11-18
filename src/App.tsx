import React from "react";
import { WalletProvider } from "./context/walletContext";
import Dashboard from "./pages/Dashboard";

const App: React.FC = () => {
  return (
    <WalletProvider>
      <Dashboard />
    </WalletProvider>
  );
};

export default App;
