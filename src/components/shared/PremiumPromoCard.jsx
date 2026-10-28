import { Button } from "@/components/ui/button";

function PremiumPromoCard({ className = "", onUpgrade, buttonLabel = "Uppgradera (demo)" }) {
  const cardClassName = ["rounded-3xl border border-veil/10 bg-surface p-5", className].filter(Boolean).join(" ");

  return (
    <article className={cardClassName}>
      <p className="text-[34px] font-semibold leading-[1.05] text-strong">
        Stick ut med
        <span className="mt-1 block w-fit rounded-2xl bg-[#f3d571] px-2 py-1 text-[34px] leading-none text-[#352922]">
          Lokalflöde Premium
        </span>
      </p>
      <p className="mt-3 text-sm text-ink-600">Premiumprofiler får i snitt fler relevanta förfrågningar och snabbare återkoppling.</p>
      <Button
        type="button"
        className="mt-4 h-auto rounded-full border-strong bg-control px-4 py-2.5 text-sm font-semibold text-strong hover:bg-control"
        onClick={onUpgrade}
      >
        {buttonLabel}
      </Button>
    </article>
  );
}

export default PremiumPromoCard;
