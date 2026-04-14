import companyLogo from "../../../Assets/Logo/LOA-Logo.png";

function TopLeftLogoPlaceholder() {
  return (
    <div className="fixed left-4 top-4 z-30 sm:left-6 sm:top-6" aria-hidden="true">
      <div className="inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3">
        <img src={companyLogo} alt="Företagslogga" className="h-9 w-9 object-contain" />
        <div>
          <p className="text-sm font-semibold">Företagsnamn</p>
          <p className="text-xs text-ink-600">Företagslogga</p>
        </div>
      </div>
    </div>
  );
}

export default TopLeftLogoPlaceholder;
