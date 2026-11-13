import { useMemo, useRef, useState } from "react";
import ViewingRequestModal from "../../components/app/ViewingRequestModal";
import ListingsPage from "../../site/ListingsPage";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import "../../site/site.css";

// The signed-in search: the same page as the public /lokaler (title, AI-sök,
// filters, list or map), with what an account adds: a heart on every card, a
// viewing booked from the map peek, and the search saved.
// The previous search mode lives in RentPageLegacy.jsx.

const appHref = (listing) => `/app/listings/${encodeURIComponent(listing.id)}`;

// The page's filters in the shape the account keeps saved searches in.
function toOldFilters(f, defaults = {}) {
  const size = Number(f.sizeAround) || 0;
  return {
    ...defaults,
    district: f.district || "Alla",
    type: f.type ? [f.type] : [],
    teamSize: f.teamSize || "",
    maxBudget: f.maxBudget || "",
    minSize: size ? String(Math.round(size * 0.8)) : "",
    maxSize: size ? String(Math.round(size * 1.2)) : "",
    readyNow: Boolean(f.readyNow),
    verified: Boolean(f.onlyVerified)
  };
}

const hasAny = (f) => Boolean(f.district || f.type || f.teamSize || f.maxBudget || f.sizeAround || f.readyNow || f.onlyVerified);

function Heart({ filled }) {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path
        d="M10 16.5s-6.5-3.9-6.5-8.6A3.4 3.4 0 0 1 10 5.8a3.4 3.4 0 0 1 6.5 2.1c0 4.7-6.5 8.6-6.5 8.6z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AuthPrompt({ mode, onClose, onRequireAuth }) {
  const message =
    mode === "save"
      ? "Logga in eller skapa ett konto för att spara lokaler och sökningar."
      : "Logga in eller skapa ett konto för att boka visning och skicka en förfrågan till hyresvärden.";
  return (
    <Dialog open={Boolean(mode)} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent showCloseButton={false} className="max-w-md rounded-3xl p-6">
        <DialogTitle className="text-xl font-semibold text-strong">Fortsätt med konto</DialogTitle>
        <DialogDescription className="mt-1 text-sm text-ink-600">{message}</DialogDescription>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={() => { onClose(); onRequireAuth?.("login"); }}>
            Logga in
          </Button>
          <Button type="button" onClick={() => { onClose(); onRequireAuth?.("signup", "renter"); }}>
            Skapa konto
          </Button>
        </div>
        <button type="button" className="mt-3 w-full text-sm text-ink-600 underline-offset-4 hover:underline" onClick={onClose}>
          Fortsätt söka utan konto
        </button>
      </DialogContent>
    </Dialog>
  );
}

export default function RentPage({ app, isGuest = false, onRequireAuth }) {
  const { user, favorites = [], toggleFavorite, requestViewing, saveCurrentFilters } = app;
  const [bookingListing, setBookingListing] = useState(null);
  const [authMode, setAuthMode] = useState("");
  const filtersRef = useRef({});
  const [savedKey, setSavedKey] = useState("");

  const favoriteIds = useMemo(() => new Set(favorites.map((entry) => String(entry?.listingId ?? entry))), [favorites]);

  function needAccount(mode) {
    if (!isGuest && user) return false;
    setAuthMode(mode);
    return true;
  }

  function onHeart(listing) {
    if (needAccount("save")) return;
    toggleFavorite?.(listing.id);
  }

  function onBook(listing) {
    if (needAccount("book")) return;
    setBookingListing(listing);
  }

  async function onSave() {
    if (needAccount("save")) return;
    await saveCurrentFilters?.(toOldFilters(filtersRef.current, app.defaultFilters));
    setSavedKey(JSON.stringify(filtersRef.current));
    app.pushToast?.("Sökningen är sparad. Vi hör av oss när nya lokaler matchar.", "success");
  }

  return (
    <div className="h-full">
      <ListingsPage
        user={user}
        listings={app.listings}
        app={{
          basePath: "/app/rent",
          hrefFor: appHref,
          cardAction: (listing) => {
          const saved = favoriteIds.has(String(listing.id));
          return (
            <button
              type="button"
              className={`lo-card-heart${saved ? " is-saved" : ""}`}
              aria-pressed={saved}
              aria-label={saved ? `Ta bort ${listing.title} från sparade` : `Spara ${listing.title}`}
              title={saved ? "Sparad" : "Spara"}
              onClick={() => onHeart(listing)}
            >
              <Heart filled={saved} />
            </button>
          );
          },
          peekAction: (listing) => {
          const saved = favoriteIds.has(String(listing.id));
          return (
            <div className="lo-peek-actions">
              <button type="button" className="lo-btn lo-btn--sm" onClick={() => onBook(listing)}>
                Boka visning
              </button>
              <button
                type="button"
                className={`lo-peek-heart${saved ? " is-saved" : ""}`}
                aria-pressed={saved}
                aria-label={saved ? "Ta bort från sparade" : "Spara lokalen"}
                onClick={() => onHeart(listing)}
              >
                <Heart filled={saved} />
              </button>
            </div>
          );
          },
          tools: (filters) => {
            // The results line hands over the filters as they stand; saving takes them from here.
            filtersRef.current = filters;
            if (!hasAny(filters)) return null;
            const isSaved = savedKey === JSON.stringify(filters);
            return (
              <button type="button" className="lo-inline-btn" onClick={onSave} disabled={isSaved}>
                {isSaved ? "Sökningen är sparad" : "Spara sökningen"}
              </button>
            );
          }
        }}
      />

      <ViewingRequestModal
        listing={bookingListing}
        onClose={() => setBookingListing(null)}
        onSubmit={async (payload) => {
          await requestViewing(payload);
          setBookingListing(null);
        }}
      />
      <AuthPrompt mode={authMode} onClose={() => setAuthMode("")} onRequireAuth={onRequireAuth} />
    </div>
  );
}
