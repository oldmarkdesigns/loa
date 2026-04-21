import AuthFlowNav from "../components/layout/AuthFlowNav";

function CallbackPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-white px-4 pb-8 pt-20">
      <AuthFlowNav />
      <div className="w-full max-w-[460px] rounded-[30px] border border-black/10 bg-white px-6 py-7 text-center sm:px-7 sm:py-8">
        <h1 className="text-[1.95rem] font-semibold leading-tight text-[#0f1930]">Slutför inloggning</h1>
        <p className="mt-2 text-sm text-ink-600">Bygger sessionen mot Convex och WorkOS.</p>
      </div>
    </main>
  );
}

export default CallbackPage;
