import MarketingNavLinks from "./MarketingNavLinks";
import { navigateTo } from "../../lib/router";
import companyLogo from "../../../Assets/Logo/68D028A1-E148-495B-BD8C-A9B789FFD8C3.PNG.png";

function AuthFlowNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-black/10 bg-white/95 backdrop-blur-md">
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3 sm:px-6">
        <button type="button" className="justify-self-start text-left" onClick={() => navigateTo("/")}>
          <span className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-black/20 bg-white">
            <img src={companyLogo} alt="Företagslogga" className="h-full w-full object-cover" />
          </span>
        </button>

        <nav className="hidden items-center justify-self-center gap-5 lg:flex">
          <MarketingNavLinks hrefPrefix="/" onPublish={() => navigateTo("/app/publish")} />
        </nav>

        <div className="flex items-center justify-self-end gap-2">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-[#0f1930] bg-[#0f1930] px-4 py-2 text-xs font-semibold text-white hover:bg-[#16233f]"
            onClick={() => navigateTo("/signup")}
          >
            Skapa konto
          </button>
          <button
            type="button"
            className="inline-flex items-center bg-transparent px-1 py-2 text-xs font-semibold text-ink-700"
            onClick={() => navigateTo("/login")}
          >
            Logga in
          </button>
        </div>
      </div>
    </header>
  );
}

export default AuthFlowNav;
