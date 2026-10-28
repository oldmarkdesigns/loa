import { Check, LoaderCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ImportFileIcon } from "./PublishImportUpload";

function foundLabel(count) {
  if (count === 0) return "Inga objekt";
  return count === 1 ? "1 objekt" : `${count} objekt`;
}

/** Live view of the files being read: one row per file, then a thin overall progress bar. */
export default function PublishImportReading({ files, progress }) {
  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <ul className="divide-y divide-veil/10 border-y border-veil/10" aria-label="Filer som läses in">
        {files.map((file) => {
          const state = progress.files[file.id];
          const status = state?.status || "waiting";
          return (
            <li key={file.id} className="flex items-center gap-3 py-3 text-left">
              <ImportFileIcon kind={file.kind} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900">{file.name}</span>
              <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-ink-500">
                {status === "done" ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    {foundLabel(state.count)}
                  </>
                ) : status === "reading" ? (
                  <>
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    Läser…
                  </>
                ) : (
                  "I kö"
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <Progress value={progress.value} aria-label="Inläsning" className="gap-0 [&_[data-slot=progress-track]]:h-1 [&_[data-slot=progress-indicator]]:duration-500" />
    </div>
  );
}
