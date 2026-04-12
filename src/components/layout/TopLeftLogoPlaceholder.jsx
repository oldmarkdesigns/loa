function TopLeftLogoPlaceholder() {
  return (
    <div className="fixed left-4 top-4 z-30 sm:left-6 sm:top-6" aria-hidden="true">
      <div className="inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-dashed border-black/30 bg-white text-[10px] font-semibold uppercase tracking-wide text-ink-500">
          LOGGA
        </span>
        <div>
          <p className="text-sm font-semibold">Företagsnamn</p>
          <p className="text-xs text-ink-600">Plats för företagslogga</p>
        </div>
      </div>
    </div>
  );
}

export default TopLeftLogoPlaceholder;
