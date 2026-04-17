function PremiumPromoCard({ className = "", onUpgrade, buttonLabel = "Uppgradera (demo)" }) {
  const cardClassName = ["rounded-3xl border border-black/10 bg-white p-5", className].filter(Boolean).join(" ");

  return (
    <article className={cardClassName}>
      <p className="text-[34px] font-semibold leading-[1.05] text-[#0f1930]">
        Stick ut med
        <span className="mt-1 block w-fit rounded-2xl bg-[#f3d571] px-2 py-1 text-[34px] leading-none text-[#352922]">
          Lokalflöde Premium
        </span>
      </p>
      <p className="mt-3 text-sm text-ink-600">Premiumprofiler får i snitt fler relevanta förfrågningar och snabbare återkoppling.</p>
      <button
        type="button"
        className="mt-4 rounded-full border border-[#0f1930] bg-white px-4 py-2.5 text-sm font-semibold text-[#0f1930]"
        onClick={onUpgrade}
      >
        {buttonLabel}
      </button>
    </article>
  );
}

export default PremiumPromoCard;
