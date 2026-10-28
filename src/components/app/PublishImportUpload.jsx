import { useRef, useState } from "react";
import { cn } from "cn";
import { FileJson, FileSpreadsheet, FileText, Image as ImageIcon, Presentation, UploadCloud, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IMPORT_ACCEPT, formatFileSize, importKindLabels } from "../../lib/listingImport";

const kindIcons = {
  spreadsheet: FileSpreadsheet,
  pdf: FileText,
  document: FileText,
  presentation: Presentation,
  data: FileJson,
  image: ImageIcon
};

export function ImportFileIcon({ kind, className }) {
  const Icon = kindIcons[kind] || FileText;
  return (
    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-subtle text-ink-700", className)}>
      <Icon className="h-4 w-4" />
    </span>
  );
}

const linkClass = "h-auto min-h-0 p-0 text-sm font-semibold underline underline-offset-4";

/** Drop zone plus the list of files picked so far. Nothing is read until the person asks for it. */
export default function PublishImportUpload({ files, error, onAddFiles, onRemoveFile, onUseSamples, onDragActiveChange }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const compact = files.length > 0;

  function setDrag(active) {
    setDragging(active);
    onDragActiveChange?.(active);
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!dragging) setDrag(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setDrag(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDrag(false);
          onAddFiles(Array.from(event.dataTransfer.files || []));
        }}
        className={cn(
          "flex flex-col items-center rounded-2xl border-2 border-dashed px-6 text-center transition-colors",
          compact ? "gap-1.5 py-4" : "gap-3 py-8",
          dragging ? "border-strong bg-subtle" : "border-veil/15 bg-control"
        )}
      >
        <UploadCloud className={cn("transition-colors", compact ? "h-5 w-5" : "h-7 w-7", dragging ? "text-ink-900" : "text-ink-500")} />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-ink-900">
            {dragging ? "Släpp filerna här" : compact ? "Dra och släpp fler filer" : "Dra och släpp filer här"}
          </p>
          <p className="text-sm text-ink-600">
            eller{" "}
            <Button type="button" variant="link" className={linkClass} onClick={() => inputRef.current?.click()}>
              bläddra bland filer
            </Button>
          </p>
        </div>
        {compact ? null : <p className="text-xs text-ink-500">Excel, CSV, PDF, Word, PowerPoint och bilder · upp till 25 MB per fil</p>}
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          tabIndex={-1}
          accept={IMPORT_ACCEPT}
          onChange={(event) => {
            onAddFiles(Array.from(event.target.files || []));
            event.target.value = "";
          }}
        />
      </div>

      {files.length > 0 ? (
        <ul className="divide-y divide-veil/10 border-y border-veil/10" aria-label="Valda filer">
          {files.map((file) => (
            <li key={file.id} className="flex items-center gap-3 py-2.5 text-left">
              <ImportFileIcon kind={file.kind} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink-900">{file.name}</span>
                <span className="block text-xs text-ink-500">
                  {importKindLabels[file.kind]} · {formatFileSize(file.size)}
                  {file.sample ? " · Exempel" : ""}
                </span>
              </span>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Ta bort ${file.name}`} onClick={() => onRemoveFile(file.id)}>
                <XIcon className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? <p role="alert" className="text-center text-sm font-medium text-rose-600">{error}</p> : null}

      {files.length === 0 ? (
        <p className="text-center text-sm text-ink-500">
          Inga dokument till hands?{" "}
          <Button type="button" variant="link" className={linkClass} onClick={onUseSamples}>
            Prova med exempelfiler
          </Button>
        </p>
      ) : null}
    </div>
  );
}
