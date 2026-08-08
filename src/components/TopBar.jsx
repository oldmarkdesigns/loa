function TopBar({ mode, onModeChange, shortlistCount }) {
  return (
    <header className="surface mx-auto mt-4 w-[min(1200px,94vw)] p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 p-3 text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 20V8l8-4 8 4v12H4Z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M9 20v-6h6v6" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-ink-900">Lokalflöde Stockholm</p>
            <p className="text-xs text-ink-600">Prototyp för snabb lokalmatchning</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onModeChange("buyer")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              mode === "buyer"
                ? "bg-ink-900 text-white"
                : "border border-ink-200 bg-[#ffffff] text-ink-700 hover:border-brand-300"
            }`}
          >
            Hyr lokal
          </button>
          <button
            type="button"
            onClick={() => onModeChange("seller")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              mode === "seller"
                ? "bg-ink-900 text-white"
                : "border border-ink-200 bg-[#ffffff] text-ink-700 hover:border-brand-300"
            }`}
          >
            Publicera lokal
          </button>
          <div className="hidden rounded-xl border border-ink-200 bg-[#ffffff] px-3 py-2 text-xs font-semibold text-ink-700 sm:block">
            Sparade objekt: {shortlistCount}
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
