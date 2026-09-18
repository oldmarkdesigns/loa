import { navigateTo } from "../../lib/router";
import { Button } from "@/components/ui/button";

function AppFooter() {
  return (
    <footer className="shrink-0 border-t border-black/10 bg-[#ffffff] px-4 py-3 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-500">© {new Date().getFullYear()} Lokalflöde Stockholm</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-500">
          <Button type="button" variant="link" className="h-auto p-0 text-xs text-ink-500 hover:text-black" onClick={() => navigateTo("/#faq")}>FAQ</Button>
          <Button type="button" variant="link" className="h-auto p-0 text-xs text-ink-500 hover:text-black" onClick={() => navigateTo("/#kontakt")}>Kontakt</Button>
          <span>Integritet</span>
          <span>Villkor</span>
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;
