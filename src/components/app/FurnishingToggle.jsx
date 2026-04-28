function FurnishingToggle({ options, value, onChange, className = "" }) {
  const safeOptions = Array.isArray(options) ? options : [];
  const activeIndex = Math.max(0, safeOptions.findIndex((option) => option.value === value));
  const segmentWidth = safeOptions.length > 0 ? 100 / safeOptions.length : 100;

  return (
    <div className={`inline-flex h-[48px] w-full items-center rounded-full border border-black/10 bg-[#fffffe] p-1 ${className}`}>
      <div className="relative h-full w-full">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-[#0f1930] shadow-[0_2px_8px_rgba(15,25,48,0.2)] transition-transform duration-250 ease-out"
          style={{
            width: `${segmentWidth}%`,
            transform: `translateX(${activeIndex * 100}%)`
          }}
        />
        <div
          className="relative grid h-full w-full"
          style={{ gridTemplateColumns: `repeat(${Math.max(1, safeOptions.length)}, minmax(0, 1fr))` }}
        >
          {safeOptions.map((option) => {
            const active = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={`min-h-0 rounded-full p-2 text-xs font-semibold leading-none transition-colors duration-200 ${
                  active ? "text-white" : "text-ink-700 hover:text-ink-900"
                }`}
                onClick={() => onChange(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FurnishingToggle;
