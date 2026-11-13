import ReactDOM from "react-dom/client";
import { AuthKitProvider, useAuth } from "@workos-inc/authkit-react";
import { ConvexProviderWithAuthKit } from "@convex-dev/workos";
import App from "./App";
import { initAnalytics } from "./lib/analytics";
import { convex, workosRedirectUri } from "./lib/convex";
import { navigateTo, publicReturnTo } from "./lib/router";
import "./index.css";
import "./radius.css";

initAnalytics();

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthKitProvider
    clientId={import.meta.env.VITE_WORKOS_CLIENT_ID || "client_placeholder"}
    redirectUri={workosRedirectUri}
    devMode={import.meta.env.DEV}
    onRedirectCallback={({ state }) => {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("office_auth_just_completed", "1");
        window.sessionStorage.removeItem("office_auth_logout_in_progress");
        if (state?.signupDraft && typeof state.signupDraft === "object") {
          window.sessionStorage.setItem("office_rental_signup_draft", JSON.stringify(state.signupDraft));
        }
      }
      const hasSignupDraft = typeof window !== "undefined" && Boolean(window.sessionStorage.getItem("office_rental_signup_draft"));
      const returnTo = typeof state?.returnTo === "string" && state.returnTo.startsWith("/")
        ? (state.returnTo.startsWith("/signup?") ? state.returnTo : publicReturnTo(state.returnTo))
        : hasSignupDraft
          ? "/signup?step=profile-extra"
          : "/signup";
      navigateTo(returnTo, { replace: true });
    }}
    onRefreshFailure={({ signIn }) => {
      if (typeof window !== "undefined" && window.sessionStorage.getItem("office_auth_logout_in_progress") === "1") {
        navigateTo("/", { replace: true });
        return;
      }
      const returnTo = `${window.location.pathname}${window.location.search}`;
      signIn({ state: { returnTo } }).catch(() => {});
    }}
  >
    <ConvexProviderWithAuthKit client={convex} useAuth={useAuth}>
      <App />
    </ConvexProviderWithAuthKit>
  </AuthKitProvider>
);
