import { useMemo, useState } from "react";
import ViewingRequestModal from "../components/app/ViewingRequestModal";
import { useAppState } from "../state/AppState";
import DotMap from "./DotMap";
import { Arrow, Band, Faq, PageHead, Rail, RuleList, Section, SiteFrame, linkTo, useAuthDoors } from "./SiteChrome";
import { findListing, listingImages, sek, siteListings } from "./siteUtils";

// /lokaler/:id: one lokal as a page. The head (what, where, the figures that
// decide it, and the two ways forward), the photographs, then the lokal, its
// facts, what is included, where it is, and the lokaler like it. Booking a
// viewing or saving needs an account; both lead through sign-in and back to
// the lokal in the app.

const AREA_NOTES = {
  Norrmalm: "Stockholms affärscentrum, med T-Centralen, Cityterminalen och Arlanda Express runt hörnet.",
  Södermalm: "Kreativt och levande, med kort väg till Slussen, Medborgarplatsen och Mariatorget.",
  Vasastan: "Lugna gator, ateljéer och caféer, mellan Odenplan och S:t Eriksplan.",
  Östermalm: "Representativt läge kring Stureplan, Karlaplan och Strandvägen.",
  Kungsholmen: "Nära vattnet och Stadshuset, med Fridhemsplan och Rådhuset som knutpunkter.",
  Solna: "Växande kontorsområde vid Arenastaden, med pendeltåg och tunnelbana till city."
};

export default function ListingPage({ user, listings, listingId }) {
  const doors = useAuthDoors();
  const listing = findListing(listings, listingId);
  const all = siteListings(listings);
  const app = useAppState();
  const [booking, setBooking] = useState(false);
  const [saveError, setSaveError] = useState("");
  const saved = app.favorites.some((entry) => entry.listingId === listing?.id);
  const listingPath = listing ? `/lokaler/${encodeURIComponent(listing.id)}` : "/lokaler";
  const signedIn = Boolean(user?.id);

  const similar = useMemo(() => {
    if (!listing) return [];
    const others = all.filter((item) => String(item.id) !== String(listing.id));
    const same = others.filter((item) => item.district === listing.district || item.type === listing.type);
    return [...same, ...others.filter((item) => !same.includes(item))].slice(0, 6);
  }, [all, listing]);

  if (!listing) {
    return (
      <SiteFrame user={user} listings={listings}>
        <PageHead back="Alla lokaler" backHref="/lokaler" label="Lokalen hittades inte" title="Den här lokalen finns inte längre." lede="Den kan ha hyrts ut eller tagits bort. Det finns fler lediga lokaler att titta på.">
          <div className="lo-actions">
            <a className="lo-btn" href="/lokaler" onClick={linkTo("/lokaler")}>
              Se lediga lokaler
              <Arrow />
            </a>
          </div>
        </PageHead>
      </SiteFrame>
    );
  }

  const images = listingImages(listing);
  // The other lokaler's photographs fill the gallery out when this one has few.
  const gallery = images.length > 1 ? images.slice(1, 5) : similar.slice(0, 2).map((item) => item.image).filter(Boolean);
  const intro = listing.description
    || `${listing.title} är en ${String(listing.type || "kontors").toLowerCase()}lokal i ${listing.district} med genomtänkt planering för team upp till ${listing.capacity} personer. Lokalen omfattar cirka ${listing.sizeSqm} kvm och passar verksamheter som vill kombinera effektiv yta med hög vardagsfunktion.`;
  const perSqm = listing.sizeSqm ? Math.round((listing.priceMonthly * 12) / listing.sizeSqm) : null;

  const bookViewing = () => (signedIn ? setBooking(true) : doors.login(listingPath));

  return (
    <>
    <SiteFrame
      user={user}
      listings={listings}
      band={
        <Band label="Visning" title={`Vill du se ${listing.title}?`} body={`Boka en visning så hör ${listing.advertiserName || "hyresvärden"} av sig${listing.responseHours ? `, oftast inom ${listing.responseHours} timmar` : ""}.`}>
          <button type="button" className="lo-btn lo-btn--light" onClick={bookViewing}>
            Boka visning
            <Arrow />
          </button>
          {signedIn ? null : (
            <a className="lo-link" href="/signup" onClick={linkTo("/signup")}>
              Skapa konto först
            </a>
          )}
        </Band>
      }
    >
      <PageHead
        back="Alla lokaler"
        backHref="/lokaler"
        label={`${listing.type} · ${listing.district}${listing.verified ? " · Verifierad" : ""}`}
        title={listing.title}
        lede={[listing.address, listing.district, "Stockholm"].filter(Boolean).join(", ")}
        media={images[0] ? { src: images[0], alt: listing.title } : undefined}
      >
        <dl className="lo-keys">
          <div>
            <dt>per månad</dt>
            <dd>{sek(listing.priceMonthly)}</dd>
          </div>
          <div>
            <dt>yta</dt>
            <dd>{listing.sizeSqm} kvm</dd>
          </div>
          <div>
            <dt>arbetsplatser</dt>
            <dd>{listing.capacity}</dd>
          </div>
          <div>
            <dt>tillträde</dt>
            <dd>{listing.availability || "Enligt överenskommelse"}</dd>
          </div>
        </dl>
        <div className="lo-actions">
          <button type="button" className="lo-btn" onClick={bookViewing}>
            Boka visning
            <Arrow />
          </button>
          <button type="button" className="lo-text-btn" onClick={async () => {
            if (!signedIn) return doors.login(listingPath);
            try { await app.toggleFavorite(listing.id); setSaveError(""); }
            catch (error) { setSaveError(error.message || "Kunde inte spara lokalen."); }
          }}>
            {saved ? "Ta bort sparad lokal" : "Spara lokalen"}
          </button>
        </div>
        {saveError && <p role="alert">{saveError}</p>}
      </PageHead>

      <Section label="Lokalen" title="Om lokalen">
        <p className="lo-lede">{intro}</p>
        {gallery.length ? (
          <div className="lo-gallery">
            {gallery.map((src) => (
              <figure key={src}>
                <img src={src} alt="" loading="lazy" decoding="async" />
              </figure>
            ))}
          </div>
        ) : null}
      </Section>

      <Section label="Fakta" title="Det viktiga, på en rad var.">
        <dl className="lo-facts">
          <div>
            <dt>Hyra</dt>
            <dd>{sek(listing.priceMonthly)} per månad</dd>
          </div>
          {perSqm ? (
            <div>
              <dt>Hyra per kvm</dt>
              <dd>{sek(perSqm)} per år</dd>
            </div>
          ) : null}
          <div>
            <dt>Yta</dt>
            <dd>{listing.sizeSqm} kvm</dd>
          </div>
          <div>
            <dt>Arbetsplatser</dt>
            <dd>Upp till {listing.capacity}</dd>
          </div>
          <div>
            <dt>Avtal</dt>
            <dd>{listing.term || "Enligt överenskommelse"}</dd>
          </div>
          <div>
            <dt>Tillträde</dt>
            <dd>{listing.availability || "Enligt överenskommelse"}</dd>
          </div>
          {listing.responseHours ? (
            <div>
              <dt>Svarar oftast inom</dt>
              <dd>{listing.responseHours} timmar</dd>
            </div>
          ) : null}
          <div>
            <dt>Hyresvärd</dt>
            <dd>{listing.advertiserName || (listing.verified ? "Verifierad hyresvärd" : "Hyresvärd")}</dd>
          </div>
        </dl>
        <p className="lo-fine">
          Vill du se hela kostnaden över avtalstiden?{" "}
          <a className="lo-link" href="/#kalkylator" onClick={linkTo("#kalkylator")}>
            Räkna i kalkylatorn
          </a>
        </p>
      </Section>

      {listing.amenities?.length ? (
        <Section label="Ingår" title="Bekvämligheter">
          <RuleList items={listing.amenities} />
        </Section>
      ) : null}

      <Section label="Läge" title={listing.district} intro={AREA_NOTES[listing.district]}>
        <div className="lo-section-map">
          <DotMap active={listing.district} compact />
        </div>
      </Section>

      {similar.length ? (
        <section className="lo-block">
          <div className="lo-wrap">
            <Rail
              label="Liknande lokaler"
              items={similar}
              more={
                <a className="lo-link" href="/lokaler" onClick={linkTo("/lokaler")}>
                  Alla lokaler
                  <Arrow />
                </a>
              }
            />
          </div>
        </section>
      ) : null}

      <Section label="Frågor" title="Innan du bokar.">
        <Faq
          items={[
            { q: "Behöver jag ett konto för att boka visning?", a: "Ja, ett gratis konto. Då kan hyresvärden svara dig direkt och du ser status för förfrågan på ett ställe." },
            { q: "Kan jag ställa frågor innan visningen?", a: "Ja. När du är inloggad kan du skicka ett meddelande till hyresvärden direkt från lokalen." },
            { q: "Är priset förhandlingsbart?", a: "Det avgör hyresvärden. Avtalslängd, tillträde och anpassningar påverkar ofta villkoren." }
          ]}
        />
      </Section>
    </SiteFrame>
    <ViewingRequestModal listing={booking ? listing : null} onClose={() => setBooking(false)} onSubmit={async (payload) => { await app.requestViewing(payload); setBooking(false); }} />
    </>
  );
}
