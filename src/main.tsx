import React from "react";
import ReactDOM from "react-dom/client";
import { WalletProvider } from "./context/walletContext";
import Dashboard from "./pages/Dashboard";
import "./index.css"; // optional, global styles

const App: React.FC = () => {
  return (
    <WalletProvider>
      <Dashboard />
    </WalletProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
