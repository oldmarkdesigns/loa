import { useEffect, useRef } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import AuthFlowNav from "../components/layout/AuthFlowNav";
import { navigateTo } from "../lib/router";
import { hasConvexConfig, hasWorkosConfig } from "../lib/convex";

function LoginPage() {
  const { isLoading, user, signIn } = useAuth();
  const signInStartedRef = useRef(false);
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get("returnTo") || "/app/rent";
  const isConfigured = hasConvexConfig && hasWorkosConfig;

  useEffect(() => {
    if (!isConfigured || isLoading || user || signInStartedRef.current) {
      return;
    }

    signInStartedRef.current = true;
    signIn({ state: { returnTo } }).catch(() => {
      signInStartedRef.current = false;
    });
  }, [isConfigured, isLoading, returnTo, signIn, user]);

  return (
    <main className="grid min-h-screen place-items-center bg-white px-4 pb-8 pt-20">
      <AuthFlowNav />
      <div className="w-full max-w-[460px] rounded-[30px] border border-black/10 bg-white px-6 py-7 sm:px-7 sm:py-8">
        <h1 className="text-[1.95rem] font-semibold leading-tight text-[#0f1930]">Logga in</h1>
        <p className="mt-1 text-sm text-ink-600">
          WorkOS hanterar inloggning, lösenord och återställning. Du skickas vidare automatiskt.
        </p>

        {!isConfigured ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Backend-auth saknar miljövariabler. Lägg till <code>VITE_CONVEX_URL</code>, <code>VITE_WORKOS_CLIENT_ID</code>
            {" "}
            och <code>VITE_WORKOS_REDIRECT_URI</code>.
          </div>
        ) : user ? (
          <div className="mt-5 rounded-2xl border border-black/10 bg-[#f8fafc] p-4 text-sm text-ink-700">
            Slutför inloggning...
          </div>
        ) : (
          <>
            <div className="mt-5 rounded-2xl border border-black/10 bg-[#f8fafc] p-4 text-sm text-ink-700">
              Vidarebefordrar till WorkOS...
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-black/20 bg-white px-6 py-3 text-sm font-semibold text-ink-800 hover:bg-[#f8fafc]"
                onClick={() => signIn({ state: { returnTo } })}
              >
                Fortsätt till WorkOS
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-black/10 bg-[#f8fafc] px-6 py-3 text-sm font-semibold text-ink-700 hover:bg-white"
                onClick={() => navigateTo(`/signup?returnTo=${encodeURIComponent(returnTo)}`)}
              >
                Skapa konto
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default LoginPage;
