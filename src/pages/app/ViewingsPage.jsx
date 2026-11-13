import { formatDate } from "../../lib/formatters";
import { navigateTo } from "../../lib/router";
import { listingImages, sek, siteListings } from "../../site/siteUtils";
import "../../site/site.css";

// The renter's viewings and inquiries, in the site's identity: a quiet list,
// each row the lokal, where its case stands on a four-step line, and what was
// written. Opening a row goes to the lokal.

const STEPS = [
  { key: "new", label: "Skickad" },
  { key: "contacted", label: "Kontakt" },
  { key: "viewing_booked", label: "Visning bokad" },
  { key: "closed", label: "Avslutad" }
];

function stepOf(status) {
  if (status === "new") return 0;
  if (status === "contacted") return 1;
  if (status === "viewing_booked" || status === "negotiating") return 2;
  return 3;
}

function statusLine(status) {
  if (status === "new") return "Väntar på svar från hyresvärden";
  if (status === "contacted") return "Hyresvärden har svarat";
  if (status === "viewing_booked") return "Tid för visning är bokad";
  if (status === "negotiating") return "Förhandling pågår";
  if (status === "won") return "Avtal klart";
  return "Ärendet är avslutat";
}

export default function ViewingsPage({ app }) {
  const viewings = Array.isArray(app.viewings) ? app.viewings : [];
  const all = siteListings(app.listings);
  const listingOf = (viewing) => viewing.listing?.title ? viewing.listing : all.find((item) => String(item.id) === String(viewing.listingId)) || viewing.listing || null;
  const open = viewings.filter((viewing) => stepOf(viewing.status) < 3).length;

  return (
    <section className="lo lo--app h-full overflow-y-auto" data-scroll-top-scope="results">
      <div className="lo-app-page">
        <header className="lo-app-head">
          <h1 className="lo-app-title">Visningar</h1>
          <p className="lo-app-lede">
            {viewings.length
              ? `${open === 0 ? "Inga ärenden pågår just nu" : open === 1 ? "Ett ärende pågår" : `${open} ärenden pågår`}. Här ser du var varje förfrågan står och vad du skrev.`
              : "När du bokar en visning eller skickar en förfrågan syns den här."}
          </p>
        </header>

        {viewings.length === 0 ? (
          <div className="lo-app-empty">
            <p>Inga förfrågningar ännu.</p>
            <button type="button" className="lo-btn" onClick={() => navigateTo("/app/rent")}>
              Hitta en lokal
            </button>
          </div>
        ) : (
          <ul className="lo-viewings">
            {viewings.map((viewing) => {
              const listing = listingOf(viewing);
              const image = listingImages(listing)[0] || listing?.image;
              const step = stepOf(viewing.status);
              const href = listing?.id ? `/app/listings/${encodeURIComponent(listing.id)}` : null;
              return (
                <li key={viewing.id} className="lo-viewing">
                  <a
                    className="lo-viewing-media"
                    href={href || undefined}
                    onClick={(event) => {
                      if (!href) return;
                      event.preventDefault();
                      navigateTo(href);
                    }}
                    aria-label={listing?.title ? `Öppna ${listing.title}` : undefined}
                  >
                    {image ? <img src={image} alt="" loading="lazy" /> : null}
                  </a>
                  <div className="lo-viewing-body">
                    <div className="lo-viewing-top">
                      <div>
                        <p className="lo-viewing-name">{listing?.title || "Lokal"}</p>
                        <p className="lo-viewing-meta">
                          {[listing?.address, listing?.district, listing?.priceMonthly ? `${sek(listing.priceMonthly)}/mån` : null].filter(Boolean).join(" · ") || "Uppgifter saknas"}
                        </p>
                      </div>
                      <p className="lo-viewing-date">{formatDate(viewing.createdAt)}</p>
                    </div>

                    <ol className="lo-track" aria-label={`Status: ${statusLine(viewing.status)}`}>
                      {STEPS.map((item, index) => (
                        <li key={item.key} className={index < step || step === 3 ? "is-done" : index === step ? "is-now" : undefined}>
                          <span className="lo-track-dot" aria-hidden="true" />
                          <span className="lo-track-label">{item.label}</span>
                        </li>
                      ))}
                    </ol>
                    <p className="lo-viewing-status">{statusLine(viewing.status)}</p>

                    {viewing.message ? <blockquote className="lo-viewing-note">{viewing.message}</blockquote> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
