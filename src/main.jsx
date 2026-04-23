import React from "react";
import ReactDOM from "react-dom/client";
import { AuthKitProvider, useAuth } from "@workos-inc/authkit-react";
import { ConvexProviderWithAuthKit } from "@convex-dev/workos";
import App from "./App";
import { initAnalytics } from "./lib/analytics";
import { convex, workosRedirectUri } from "./lib/convex";
import { navigateTo } from "./lib/router";
import "./index.css";

initAnalytics();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthKitProvider
      clientId={import.meta.env.VITE_WORKOS_CLIENT_ID || "client_placeholder"}
      redirectUri={workosRedirectUri}
      devMode={import.meta.env.DEV}
      onRedirectCallback={({ state }) => {
        const returnTo = typeof state?.returnTo === "string" && state.returnTo.startsWith("/")
          ? state.returnTo
          : "/callback";
        navigateTo(returnTo, { replace: true });
      }}
      onRefreshFailure={({ signIn }) => {
        const returnTo = `${window.location.pathname}${window.location.search}`;
        signIn({ state: { returnTo } }).catch(() => {});
      }}
    >
      <ConvexProviderWithAuthKit client={convex} useAuth={useAuth}>
        <App />
      </ConvexProviderWithAuthKit>
    </AuthKitProvider>
  </React.StrictMode>
);
