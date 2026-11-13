// The premium invitation, as the site's dark band: navy paper, one large line, a light pill.
function PremiumPromoCard({ className = "", onUpgrade, buttonLabel = "Uppgradera (demo)" }) {
  const cardClassName = ["rounded-[22px] bg-[#0f1422] p-6 text-white", className].filter(Boolean).join(" ");

  return (
    <article className={cardClassName} data-premium-card>
      <p className="text-[13px] text-white/50">LOA Premium</p>
      <p className="mt-3 text-[30px] font-normal leading-[1.05] tracking-[-0.04em] text-balance">Stick ut för hyresvärdarna.</p>
      <p className="mt-3 text-sm text-white/60">Premiumprofiler får i snitt fler relevanta förfrågningar och snabbare återkoppling.</p>
      <button
        type="button"
        className="mt-6 inline-flex h-10 !min-h-0 items-center !rounded-full bg-white px-5 text-sm font-medium text-[#0f1422] transition-colors hover:bg-white/90"
        onClick={onUpgrade}
      >
        {buttonLabel}
      </button>
    </article>
  );
}

export default PremiumPromoCard;
