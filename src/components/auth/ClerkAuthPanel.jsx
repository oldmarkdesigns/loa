import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { useState } from "react";

function ClerkAuthPanel({ onClerkContinue, onDemoLogin, continueLabel = "Fortsätt med Clerk-session" }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="mt-5 rounded-2xl border border-black/10 bg-[#f7f9fc] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-600">
        Beta-auth (Clerk)
      </p>

      <div className="mt-2 flex items-center gap-2">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-[#0f1930] bg-[#0f1930] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#16233f]"
            >
              Logga in med Clerk
            </button>
          </SignInButton>

          <SignUpButton mode="modal">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-black/20 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-[#f8fafc]"
            >
              Skapa Clerk-konto
            </button>
          </SignUpButton>

          {onDemoLogin ? (
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-emerald-700 bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
              onClick={async () => {
                setPending(true);
                setError("");
                try {
                  await onDemoLogin();
                } catch (submitError) {
                  setError(submitError.message || "Kunde inte logga in demo-konto.");
                } finally {
                  setPending(false);
                }
              }}
              disabled={pending}
            >
              {pending ? "Laddar..." : "Test: Demo Kombi"}
            </button>
          ) : null}
        </Show>

        <Show when="signed-in">
          <div className="flex items-center gap-2">
            <UserButton />
            <span className="text-xs text-ink-600">Inloggad i Clerk</span>
            {onClerkContinue ? (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-[#0f1930] bg-[#0f1930] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#16233f]"
                onClick={async () => {
                  setPending(true);
                  setError("");
                  try {
                    await onClerkContinue();
                  } catch (submitError) {
                    setError(submitError.message || "Kunde inte fortsätta med Clerk.");
                  } finally {
                    setPending(false);
                  }
                }}
                disabled={pending}
              >
                {pending ? "Laddar..." : continueLabel}
              </button>
            ) : null}
          </div>
        </Show>
      </div>

      {error ? <p className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}

export default ClerkAuthPanel;
