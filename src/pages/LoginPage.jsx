import { useState } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import { AccountLayout, SiteFrame, linkTo } from "../site/SiteChrome";
import { publicReturnTo } from "../lib/router";

export default function LoginPage({ user, onLogout }) {
  const { signIn } = useAuth();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function login() {
    setPending(true);
    setError("");
    try {
      await signIn({ state: { returnTo: publicReturnTo(new URLSearchParams(window.location.search).get("returnTo")) } });
    } catch {
      setError("Kunde inte öppna inloggningen. Försök igen.");
      setPending(false);
    }
  }
  return <SiteFrame navActions={false}>
    <AccountLayout label="Ditt konto" title={user ? "Du är inloggad." : "Välkommen tillbaka."} lede={user ? user.email : "Logga in på LOA med din e-postadress."}>
      {error && <p role="alert">{error}</p>}
      <div className="lo-actions">
        {user ? <><a className="lo-btn" href="/lokaler" onClick={linkTo("/lokaler")}>Se lediga lokaler</a><button className="lo-btn lo-btn--ghost" onClick={onLogout}>Logga ut</button></> : <button className="lo-btn" disabled={pending} onClick={login}>{pending ? "Öppnar…" : "Logga in"}</button>}
        <a className="lo-link" href="/signup" onClick={linkTo("/signup")}>Skapa konto</a>
      </div>
    </AccountLayout>
  </SiteFrame>;
}
