import { useState } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import { navigateTo } from "../lib/router";
import AuthFlowNav from "../components/layout/AuthFlowNav";

function ForgotPasswordPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7f8] px-4 pb-8 pt-28">
      <AuthFlowNav />
      <div className="w-full max-w-[460px]">
        <div className="rounded-[30px] border border-black/10 bg-[#ffffff] px-6 py-7 sm:px-7 sm:py-8">
          <h1 className="text-[1.95rem] font-semibold leading-tight text-[#0b0a0e]">Glömt lösenord</h1>
          <p className="mt-1 text-sm text-ink-600">
            Ange din e-postadress så skickar vi en återställningslänk.
          </p>

          <form
            className="mt-5 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              setSent(true);
            }}
          >
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-ink-700">E-post</span>
              <input
                className="field"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <button type="submit" className="inline-flex w-full items-center justify-center rounded-full bg-[#0b0a0e] px-4 py-3 text-sm font-semibold text-white transition">
              Skicka återställningslänk
            </button>

            {sent ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">Om kontot finns har vi skickat en återställningslänk.</p> : null}
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-ink-700">Minns du lösenordet?</p>
            <button
              type="button"
              className="mt-2 inline-flex items-center justify-center rounded-full border border-black/20 bg-[#ffffff] px-4 py-2 text-xs font-semibold text-ink-700 hover:bg-[#f8fafc]"
              onClick={() => signIn({ state: { returnTo: "/app/rent" } }).catch(() => navigateTo("/"))}
            >
              Logga in
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-500">
          Genom att fortsätta godkänner du Lokalflödes användarvillkor och integritetspolicy.
        </p>
      </div>
    </main>
  );
}

export default ForgotPasswordPage;
