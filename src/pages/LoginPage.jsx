import { useEffect, useRef, useState } from "react";
import { SignIn, useUser } from "@clerk/react";
import { defaultAppPathForRole, navigateTo } from "../lib/router";
import AuthFlowNav from "../components/layout/AuthFlowNav";

function LoginPage({ onClerkContinue, onDemoLogin }) {
  const { isLoaded, isSignedIn } = useUser();
  const hasClerkKey = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
  const continueAttemptedRef = useRef(false);
  const clerkCardWrapRef = useRef(null);
  const [clerkCardWidth, setClerkCardWidth] = useState(null);
  const [clerkInitTimedOut, setClerkInitTimedOut] = useState(false);

  useEffect(() => {
    if (!isSignedIn || continueAttemptedRef.current) {
      return;
    }
    continueAttemptedRef.current = true;
    onClerkContinue()
      .then((nextUser) => {
        navigateTo(nextUser.onboardingCompleted ? defaultAppPathForRole(nextUser.role) : "/onboarding");
      })
      .catch(() => {
        continueAttemptedRef.current = false;
      });
  }, [isSignedIn, onClerkContinue]);

  useEffect(() => {
    if (isLoaded) {
      setClerkInitTimedOut(false);
      return undefined;
    }
    const timeoutId = window.setTimeout(() => setClerkInitTimedOut(true), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [isLoaded]);

  useEffect(() => {
    const wrap = clerkCardWrapRef.current;
    if (!wrap) return undefined;

    const resolveCardWidth = () => {
      const card = wrap.querySelector(".cl-card");
      setClerkCardWidth(card ? Math.round(card.getBoundingClientRect().width) : null);
    };

    resolveCardWidth();
    const observer = new ResizeObserver(resolveCardWidth);
    observer.observe(wrap);

    return () => observer.disconnect();
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-white px-4 pb-8 pt-20">
      <AuthFlowNav />
      <div className="w-full">
        <div ref={clerkCardWrapRef} className="mx-auto w-fit max-w-full">
          {!hasClerkKey ? (
            <div className="w-[430px] max-w-full rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Clerk saknar publishable key i denna build. Lägg till <code>VITE_CLERK_PUBLISHABLE_KEY</code> i deploy-miljön och bygg om.
            </div>
          ) : !isLoaded && clerkInitTimedOut ? (
            <div className="w-[430px] max-w-full rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Clerk kunde inte initieras. Kontrollera deploy-miljövariabeln och att din deploy-domän är tillåten i Clerk dashboard.
            </div>
          ) : !isLoaded ? (
            <div className="h-[580px] w-[430px] max-w-full rounded-xl border border-black/10 bg-white" aria-hidden="true" />
          ) : !isSignedIn ? (
            <SignIn
              routing="virtual"
              signUpUrl="/signup"
              fallbackRedirectUrl="/login"
            />
          ) : null}
        </div>

        <div className="mx-auto mt-4 text-center" style={clerkCardWidth ? { width: `${clerkCardWidth}px`, maxWidth: "100%" } : undefined}>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-black/20 bg-white px-6 py-3 text-sm font-semibold text-ink-800 hover:bg-[#f8fafc]"
            onClick={async () => {
              const nextUser = await onDemoLogin();
              navigateTo(nextUser.onboardingCompleted ? defaultAppPathForRole(nextUser.role) : "/onboarding");
            }}
          >
            Testkonto
          </button>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-500">
            Genom att fortsätta godkänner du Lokalflödes användarvillkor och integritetspolicy.
          </p>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
