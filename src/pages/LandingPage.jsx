import { useEffect, useMemo, useState } from "react";
import { navigateTo } from "../lib/router";
import { districtOptions } from "../data/mockData";
import DotMap from "../site/DotMap";
import TocCalculator from "../site/TocCalculator";
import { Arrow, DemoBand, Faq, Field, Rail, Rows, SiteFrame, linkTo } from "../site/SiteChrome";
import { scrollToId, siteListings } from "../site/siteUtils";
import strandvagen from "../site/assets/strandvagen.jpg";

// The homepage of the public site, in the studio's order: a sentence and the
// search beside the city in dots; what LOA is, beside Strandvägen; the lokaler
// themselves; how it works; the lokalprogram; the cost calculator; the way in
// for hyresvärdar; questions; and the dark invitation before the footer.

export const faqItems = [
  {
    q: "Kostar det något att söka lokal?",
    a: "Nej. Att söka, spara lokaler, skapa ett lokalprogram och boka visningar är gratis för hyresgäster."
  },
  {
    q: "Kan jag publicera gratis?",
    a: "Ja. Under lanseringsperioden publicerar hyresvärdar och mäklare ett obegränsat antal annonser utan kostnad."
  },
  {
    q: "Kan samma konto vara både hyresgäst och hyresvärd?",
    a: "Ja. Du växlar roll direkt i plattformen utan att skapa ett nytt konto."
  },
  {
    q: "Vad är ett lokalprogram?",
    a: "En beskrivning av vad ni behöver: yta, budget, område, typ av lokal och avtal. Det sparas i profilen och används direkt i matchningen."
  },
  {
    q: "Hur snabbt får jag svar på en förfrågan?",
    a: "Det beror på objektet, men varje annons visar hyresvärdens vanliga svarstid. De flesta svarar inom några timmar."
  },
  {
    q: "Finns AI-sök?",
    a: "Ja. Beskriv behovet med egna ord så tolkar AI-sök det till filter och visar lokalerna som passar, på karta och i lista."
  }
];

const STEPS = [
  { title: "Skapa konto och välj roll", body: "Som hyresgäst, hyresvärd eller mäklare. Samma konto rymmer flera roller." },
  { title: "Sök eller publicera", body: "Filtrera, använd AI-sök eller ert lokalprogram. Hyresvärdar publicerar steg för steg." },
  { title: "Boka och följ upp", body: "Visningar, förfrågningar och dialog samlas i en vy, med status för varje objekt." }
];

const PROGRAM = [
  { title: "Beskriv behovet", body: "Lokaltyp, storlek, budget och läge. Fem minuter, en gång." },
  { title: "Sparat i profilen", body: "Programmet finns kvar och går att uppdatera när behoven ändras, så slipper ni börja om." },
  { title: "Matchat direkt", body: "Aktivera programmet bland lediga lokaler och se vilka som passar, med en förklaring för varje träff." }
];

const LANDLORD_ROWS = [
  { name: "Publicera gratis", desc: "Obegränsat antal annonser under hela lanseringsperioden." },
  { name: "Importera annonser", desc: "Läs in ett befintligt prospekt, granska fälten och publicera." },
  { name: "Leads i en pipeline", desc: "Förfrågningar, visningar och status samlade per objekt." },
  { name: "Synlighetslyft", desc: "Topplacering och förnyad annons när ni vill sticka ut." }
];

function LandingPage({ user, listings = [] }) {
  const all = siteListings(listings);
  const [search, setSearch] = useState({ teamSize: "", district: "" });

  const counts = useMemo(() => {
    const map = Object.fromEntries(districtOptions.map((name) => [name, 0]));
    all.forEach((item) => {
      if (item.district in map) map[item.district] += 1;
    });
    return map;
  }, [all]);

  const avgResponse = useMemo(() => {
    const hours = all.map((item) => Number(item.responseHours)).filter((value) => value > 0);
    return hours.length ? Math.round(hours.reduce((a, b) => a + b, 0) / hours.length) : 2;
  }, [all]);

  // Links such as /#faq from other pages land here.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return undefined;
    const timer = window.setTimeout(() => scrollToId(hash), 80);
    return () => window.clearTimeout(timer);
  }, []);

  function submitSearch(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.district) params.set("district", search.district);
    if (search.teamSize.trim()) params.set("teamSize", search.teamSize.trim());
    const query = params.toString();
    navigateTo(`/lokaler${query ? `?${query}` : ""}`);
  }

  return (
    <SiteFrame user={user} listings={listings} band={<DemoBand />}>
      <section className="lo-hero">
        <div className="lo-wrap lo-hero-grid">
          <div className="lo-hero-copy">
            <h1 className="lo-statement">Lediga kontor och lokaler i Stockholm, från första sökning till inflytt.</h1>
            <div className="lo-hero-foot">
              <p>
                {all.length} lediga lokaler i sex områden, från verifierade hyresvärdar och mäklare. Gratis att söka.
                <a className="lo-link" href="/lokaler" onClick={linkTo("/lokaler")}>
                  Se alla lokaler
                  <Arrow />
                </a>
              </p>
            </div>
            <form className="lo-search" onSubmit={submitSearch} role="search" aria-label="Sök lokaler">
              <Field label="Antal platser">
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={search.teamSize}
                  onChange={(event) => setSearch((previous) => ({ ...previous, teamSize: event.target.value }))}
                  placeholder="Hur många är ni?"
                />
              </Field>
              <Field label="Område">
                <select value={search.district} onChange={(event) => setSearch((previous) => ({ ...previous, district: event.target.value }))}>
                  <option value="">Alla områden</option>
                  {districtOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>
              <button type="submit" className="lo-btn">
                Sök lokaler
                <Arrow />
              </button>
            </form>
            <p className="lo-fine" style={{ marginTop: 20 }}>
              Hellre beskriva behovet med egna ord?{" "}
              <a className="lo-link" href="/lokaler#sok" onClick={linkTo("/lokaler#sok")}>
                Prova AI-sök
              </a>
            </p>
          </div>
          <div className="lo-hero-map">
            <DotMap counts={counts} onSelect={(district) => navigateTo(`/lokaler?district=${encodeURIComponent(district)}`)} />
          </div>
        </div>

        <div className="lo-wrap lo-intro">
          <figure className="lo-intro-photo">
            <img src={strandvagen} alt="Strandvägen i Stockholm i skymningen" width="1067" height="1600" loading="lazy" decoding="async" />
          </figure>
          <div className="lo-intro-text">
            <p className="lo-label">Om LOA</p>
            <h2 className="lo-title">En marknadsplats byggd för affären, inte bara för annonsen.</h2>
            <p className="lo-lede">
              LOA samlar hyresgäst och hyresvärd i samma flöde: sökning, lokalprogram, visningar och dialog. Färre mejltrådar,
              snabbare svar och ett tydligt nästa steg för båda sidor.
            </p>
            <dl className="lo-figures">
              <div>
                <dt>lediga lokaler</dt>
                <dd>{all.length}</dd>
              </div>
              <div>
                <dt>områden i Stockholm</dt>
                <dd>{districtOptions.length}</dd>
              </div>
              <div>
                <dt>svarstid i snitt</dt>
                <dd>{avgResponse} h</dd>
              </div>
            </dl>
            <ul className="lo-check-list">
              <li>Verifierade hyresvärdar och mäklare</li>
              <li>Lokalprogram som matchar automatiskt</li>
              <li>Visningar och dialog på ett ställe</li>
              <li>Gratis att publicera under lanseringen</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="lo-block" id="lokaler">
        <div className="lo-wrap">
          <Rail
            label="Lediga just nu"
            items={all.slice(0, 9)}
            more={
              <a className="lo-link" href="/lokaler" onClick={linkTo("/lokaler")}>
                Alla {all.length} lokaler
                <Arrow />
              </a>
            }
          />
        </div>
      </section>

      <section className="lo-block" id="sa-fungerar-det">
        <div className="lo-wrap">
          <div className="lo-split">
            <div className="lo-side">
              <p className="lo-label">Så fungerar det</p>
              <h2 className="lo-title">Tre steg till en snabbare uthyrning.</h2>
              <p className="lo-muted">Hela flödet på ett ställe, från konto till bokad visning, så att inget faller mellan stolarna.</p>
            </div>
            <div className="lo-body lo-who">
              <h3>För dig som hyr, och dig som hyr ut.</h3>
              <p className="lo-lede">
                Samma konto fungerar för båda rollerna. Växla mellan att söka lokal och att hantera era objekt utan att logga ut.
              </p>
            </div>
          </div>
          <ol className="lo-steps-row">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className="lo-steps-num">{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="lo-block" id="lokalprogram">
        <div className="lo-wrap lo-split">
          <div className="lo-side">
            <p className="lo-label">Lokalprogram</p>
            <h2 className="lo-title">Beskriv behovet en gång. Låt matchningen göra resten.</h2>
            <p className="lo-muted">Tydliga behov från start ger bättre träffar och en kortare väg till rätt lokal.</p>
          </div>
          <div className="lo-body">
            <Rows numbered items={PROGRAM} />
            <div className="lo-actions">
              <a className="lo-btn" href="/signup" onClick={linkTo("/signup")}>
                Skapa lokalprogram
                <Arrow />
              </a>
              <a className="lo-link" href="/lokaler" onClick={linkTo("/lokaler")}>
                Se lediga lokaler först
                <Arrow />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="lo-block" id="kalkylator">
        <div className="lo-wrap lo-split">
          <div className="lo-side">
            <p className="lo-label">Kalkylator</p>
            <h2 className="lo-title">Vad kostar lokalen egentligen?</h2>
            <p className="lo-muted">
              Bashyran är sällan hela priset. Lägg till drift, skatt och anpassning och se den totala kostnaden över avtalstiden.
            </p>
          </div>
          <div className="lo-body">
            <TocCalculator />
          </div>
        </div>
      </section>

      <section className="lo-block" id="for-hyresvardar">
        <div className="lo-wrap lo-split">
          <div className="lo-list-side">
            <p className="lo-label">För hyresvärdar och mäklare</p>
            <figure className="lo-list-photo">
              <img src="/object-images/object-9.jpeg" alt="Ljust kontor med glasväggar" loading="lazy" decoding="async" />
            </figure>
          </div>
          <ul className="lo-link-list">
            {LANDLORD_ROWS.map((row) => (
              <li key={row.name}>
                <a href="/hyresvardar" onClick={linkTo("/hyresvardar")}>
                  <span className="lo-link-name">{row.name}</span>
                  <span className="lo-link-desc">{row.desc}</span>
                  <Arrow size={16} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="lo-block" id="faq">
        <div className="lo-wrap lo-split">
          <div className="lo-side">
            <p className="lo-label">Frågor</p>
            <h2 className="lo-title">Vanliga frågor.</h2>
            <p className="lo-muted">Hittar du inte svaret? Boka en kort demo eller skriv till oss.</p>
          </div>
          <div className="lo-body">
            <Faq items={faqItems} />
          </div>
        </div>
      </section>
    </SiteFrame>
  );
}

export default LandingPage;
