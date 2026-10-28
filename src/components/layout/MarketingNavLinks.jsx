import { navigateTo } from "../../lib/router";
import { Button } from "@/components/ui/button";

export const marketingPrimaryItems = [
  { label: "Lediga lokaler", href: "/app/rent?view=available" },
];

export const marketingSectionItems = [
  { label: "Så fungerar det", hash: "#sa-fungerar-det" },
  { label: "Lokalprogram", hash: "#lokalprogram" },
  { label: "TOC-kalkylator", hash: "#toc-kalkylator" },
  { label: "Priser", hash: "#priser" },
  { label: "FAQ", hash: "#faq" }
];

// `light` is for links over a dark image: white text and a white underline.
function baseNavClass(active = false, light = false) {
  const text = light ? "text-white hover:text-white nav-underline-anim-light" : "text-strong hover:text-strong";
  return `nav-underline-anim text-sm font-semibold transition ${text} ${active ? "nav-underline-anim-active" : ""}`;
}

function MarketingNavLinks({ hrefPrefix = "", onSectionLinkClick, onPublish, onPrimaryNavClick, showPublish = true, activeHref, activeHash, light = false }) {
  return (
    <>
      {marketingPrimaryItems.map((item) => {
        return (
          <a
            key={item.label}
            href={item.href}
            className={baseNavClass(activeHref === item.href, light)}
            onClick={(event) => {
              if (onPrimaryNavClick?.(event, item) === true) {
                return;
              }
              event.preventDefault();
              navigateTo(item.href);
            }}
          >
            {item.label}
          </a>
        );
      })}
      {marketingSectionItems.map((item) => {
        const href = `${hrefPrefix}${item.hash}`;
        return (
          <a
            key={item.hash}
            href={href}
            className={baseNavClass(activeHash === item.hash, light)}
            onClick={onSectionLinkClick ? (event) => onSectionLinkClick(event, item.hash) : undefined}
          >
            {item.label}
          </a>
        );
      })}
      {showPublish ? (
        <Button
          type="button"
          variant="outline"
          className="h-auto gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-strong hover:bg-strong hover:text-on-strong"
          onClick={onPublish}
        >
          <span aria-hidden="true" className="text-sm leading-none">+</span>
          <span>Publicera annons</span>
        </Button>
      ) : null}
    </>
  );
}

export default MarketingNavLinks;
