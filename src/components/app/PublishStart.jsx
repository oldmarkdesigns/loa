import { FileUp, PencilLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function StartOption({ icon: Icon, title, description, footnote, badge, onClick }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="h-auto w-full flex-col items-start justify-start gap-4 whitespace-normal rounded-2xl p-5 text-left hover:border-veil/30"
    >
      <span className="flex w-full items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-subtle text-ink-900">
          <Icon className="h-5 w-5" />
        </span>
        {badge ? <Badge variant="secondary" className="h-auto rounded-full px-2 py-0.5 text-[10px] font-semibold">{badge}</Badge> : null}
      </span>
      <span className="block space-y-1.5">
        <span className="block text-base font-semibold text-ink-900">{title}</span>
        <span className="block text-sm font-normal leading-relaxed text-ink-600">{description}</span>
      </span>
      {footnote ? <span className="block text-xs font-medium text-ink-500">{footnote}</span> : null}
    </Button>
  );
}

/** First screen of "Publicera annons": write the listing by hand, or read it from existing documents. */
export default function PublishStart({ onManual, onUpload }) {
  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <StartOption
          icon={PencilLine}
          title="Skapa manuellt"
          description="Svara på några korta frågor, en i taget."
          footnote="Tar ungefär tre minuter"
          onClick={onManual}
        />
        <StartOption
          icon={FileUp}
          title="Ladda upp dokument"
          description="Excel, prospekt och annan data som vi läser in åt dig."
          footnote="Ett eller flera objekt på en gång"
          badge="AI"
          onClick={onUpload}
        />
      </div>
      <p className="text-center text-xs text-ink-500">Du granskar alltid allt innan något publiceras.</p>
    </div>
  );
}
