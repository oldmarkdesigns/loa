import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import { svSE } from "@clerk/localizations";
import App from "./App";
import { initAnalytics } from "./lib/analytics";
import "./index.css";

initAnalytics();

const svSEWithOverrides = {
  ...svSE,
  formFieldInputPlaceholder__signUpPassword: "Skapa ett lösenord"
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider localization={svSEWithOverrides} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
