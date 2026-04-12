import TopLeftLogoPlaceholder from "./TopLeftLogoPlaceholder";

function PublicLayout({ title, subtitle, children, cta }) {
  return (
    <main className="min-h-screen bg-white px-4 py-6 sm:px-6">
      <TopLeftLogoPlaceholder />
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex items-center justify-between rounded-3xl border border-black/10 bg-white px-5 py-4">
          <div>
            <p className="text-lg font-semibold text-black">Lokalflöde Stockholm</p>
            <p className="text-xs text-ink-600">MVP för snabb lokalmatchning i Sverige</p>
          </div>
          {cta ? <div>{cta}</div> : null}
        </header>

        <section className="rounded-3xl border border-black/10 bg-white p-5 sm:p-8">
          <div className="mb-5">
            <h1 className="text-3xl font-semibold text-black sm:text-4xl">{title}</h1>
            {subtitle ? <p className="mt-2 max-w-2xl text-sm text-ink-600">{subtitle}</p> : null}
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}

export default PublicLayout;
