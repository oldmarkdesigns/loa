import { useState } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import { AccountLayout, SiteFrame, linkTo } from "../site/SiteChrome";

export default function ForgotPasswordPage() {
  const { signIn } = useAuth();
  const [error, setError] = useState("");
  return <SiteFrame slim navActions={false}>
    <AccountLayout label="Konto" title="Glömt lösenordet?" lede="Öppna inloggningen och välj Glömt lösenordet för att återställa ditt lösenord säkert hos WorkOS.">
      {error && <p role="alert">{error}</p>}
      <button type="button" className="lo-btn" onClick={async () => {
        try { await signIn({ state: { returnTo: "/lokaler" } }); }
        catch { setError("Kunde inte öppna inloggningen. Försök igen."); }
      }}>Öppna kontoåterställning</button>
      <p className="lo-account-alt"><a href="/login" onClick={linkTo("/login")}>Tillbaka till inloggning</a></p>
    </AccountLayout>
  </SiteFrame>;
}
