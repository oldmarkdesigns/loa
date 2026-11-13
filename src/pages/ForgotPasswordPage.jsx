import { useState } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import { navigateTo } from "../lib/router";
import { AccountLayout, Arrow, Field, SiteFrame } from "../site/SiteChrome";

function ForgotPasswordPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <SiteFrame slim navActions={false}>
      <AccountLayout
        label="Konto"
        title={sent ? "Kolla din inkorg." : "Glömt lösenordet?"}
        lede={
          sent
            ? "Om det finns ett konto för adressen har vi skickat en länk."
            : "Ange e-postadressen du loggar in med, så skickar vi en länk för att välja ett nytt."
        }
      >
        <form
          className="lo-form"
          onSubmit={(event) => {
            event.preventDefault();
            setSent(true);
          }}
        >
          <Field label="E-post">
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="namn@foretag.se" required />
          </Field>

          {sent ? (
            <p className="lo-note is-done" role="status">
              Länken är skickad till {email}. Hittar du den inte? Titta i skräpposten eller skicka igen.
            </p>
          ) : null}

          <div className="lo-actions">
            <button type="submit" className="lo-btn">
              {sent ? "Skicka igen" : "Skicka länk"}
              <Arrow />
            </button>
          </div>

          <p className="lo-account-alt">
            Minns du lösenordet?
            <button
              type="button"
              className="lo-text-btn"
              onClick={() => signIn({ state: { returnTo: "/lokaler" } }).catch(() => navigateTo("/"))}
            >
              Logga in
            </button>
          </p>
        </form>
        <p className="lo-fine">Genom att fortsätta godkänner du LOA:s användarvillkor och integritetspolicy.</p>
      </AccountLayout>
    </SiteFrame>
  );
}

export default ForgotPasswordPage;
