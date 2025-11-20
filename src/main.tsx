import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { WalletProvider } from "./context/WalletContext";
import { UserProvider } from "./context/UserContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <WalletProvider>
        <UserProvider>
          <App />
        </UserProvider>
      </WalletProvider>
    </BrowserRouter>
  </React.StrictMode>
);
