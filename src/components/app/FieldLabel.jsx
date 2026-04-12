function FieldLabel({ children, required = false }) {
  return (
    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">
      {children}
      {required ? <span className="ml-1 align-top text-[11px] text-[#0f1930]">✶</span> : null}
    </span>
  );
}

export default FieldLabel;
