function ToastStack({ toasts = [], workspace = false }) {
  if (!toasts.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(360px,94vw)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          data-loa-surface={workspace ? "toast" : undefined}
          data-tone={toast.type}
          role={toast.type === "error" ? "alert" : "status"}
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
            toast.type === "success"
              ? "border-[#10b981]/50 bg-[#047857] text-white"
              : toast.type === "error"
                ? "border-[#f43f5e]/50 bg-[#be123c] text-white"
                : "border-veil/20 bg-ink-900 text-white dark:text-on-strong"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export default ToastStack;
