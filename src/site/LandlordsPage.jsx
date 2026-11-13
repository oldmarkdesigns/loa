import { Arrow, DemoBand, Faq, PageHead, PageMedia, RuleList, Rows, Section, SiteFrame, linkTo } from "./SiteChrome";
import gamlaStan from "./assets/gamla-stan.jpg";

// /hyresvardar: the offer to hyresvärdar and mäklare. The head with the first
// step, Gamla stan across the page, then how publishing works, what it costs,
// what is included and the questions they ask. Signing up here starts the
// lease-out branch of /signup (the role step).

const SIGNUP_LANDLORD = "/signup?step=role&intentSelection=lease-out&role=company_admin";

const STEPS = [
  { title: "Skapa konto", body: "Som hyresvärd eller mäklare. Ange organisationsnummer så kopplas kontot till ert bolag." },
  { title: "Importera eller skapa", body: "Läs in en befintlig annons eller ett prospekt, eller fyll i lokalen steg för steg med hjälp av assistenten." },
  { title: "Granska och publicera", body: "Se annonsen som hyresgästen ser den innan den går live. Ändra när som helst efteråt." },
  { title: "Följ intresset", body: "Förfrågningar och visningar landar i en pipeline per objekt, med status, anteckningar och nästa steg." }
];

const INCLUDED = [
  "Obegränsat antal annonser",
  "Import av befintliga annonser",
  "Lead-pipeline per objekt",
  "Visningsbokning",
  "Meddelanden med hyresgäster",
  "Statistik per annons",
  "Flera användare per bolag",
  "Delbara prospekt med kommentarer"
];

const FAQ = [
  { q: "Vad kostar det att publicera?", a: "Inget under lanseringsperioden. Ni publicerar obegränsat antal annonser och får tillgång till hela plattformen." },
  { q: "Kan flera på bolaget använda samma konto?", a: "Ja. Bolagsadministratören bjuder in kollegor och mäklare, och alla ser samma objekt och leads." },
  { q: "Vad är skillnaden på hyresvärd och mäklare?", a: "Hyresvärden äger bolagets konto och objekt. Mäklare publicerar och hanterar objekt för en eller flera hyresvärdar." },
  { q: "Kan vi importera annonser vi redan har?", a: "Ja. Ladda upp eller klistra in en befintlig annons så läser vi ut fälten, och ni granskar innan publicering." }
];

export default function LandlordsPage({ user, listings }) {
  return (
    <SiteFrame
      user={user}
      listings={listings}
      band={<DemoBand title="Se plattformen innan ni bestämmer er." body="Tjugo minuter med oss: publicering, import, leads och statistik, med era egna objekt som exempel." />}
    >
      <PageHead
        back="Startsida"
        label="För hyresvärdar och mäklare"
        title="Publicera lokaler gratis. Få förfrågningar som passar."
        lede="Hyresgäster på LOA har ofta ett lokalprogram: yta, budget och område beskrivet från start. Det ger färre men bättre förfrågningar, och en tydlig väg till visning."
      >
        <div className="lo-actions">
          <a className="lo-btn" href={SIGNUP_LANDLORD} onClick={linkTo(SIGNUP_LANDLORD)}>
            Börja publicera
            <Arrow />
          </a>
          <a className="lo-link" href="#priser" onClick={linkTo("#priser")}>
            Se priser
            <Arrow />
          </a>
        </div>
      </PageHead>

      <PageMedia src={gamlaStan} alt="Fasader vid Stortorget i Gamla stan" position="50% 75%" />

      <Section id="sa-gar-det-till" label="Så går det till" title="Från tom annons till bokad visning." intro="Fyra steg, och de flesta tar några minuter.">
        <Rows numbered items={STEPS} />
      </Section>

      <Section id="priser" label="Priser" title="Gratis att komma igång." intro="Betala bara för extra synlighet, när ni vill sticka ut.">
        <div className="lo-plans">
          <article className="lo-plan lo-plan--lead">
            <p className="lo-label">Under lanseringen</p>
            <p className="lo-plan-price">
              0 kr <span>per månad</span>
            </p>
            <p className="lo-plan-note">Publicera obegränsat antal annonser och använd hela plattformen utan kostnad.</p>
            <ul>
              <li>Obegränsat antal annonser</li>
              <li>Lead-pipeline och visningar</li>
              <li>Flera användare per bolag</li>
            </ul>
            <a className="lo-btn lo-btn--light" href={SIGNUP_LANDLORD} onClick={linkTo(SIGNUP_LANDLORD)}>
              Börja publicera
              <Arrow />
            </a>
          </article>
          <article className="lo-plan">
            <p className="lo-label">Synlighetslyft</p>
            <p className="lo-plan-price" style={{ fontSize: "clamp(2rem, 3vw, 2.75rem)" }}>
              Per annons
            </p>
            <p className="lo-plan-note">Lägg till räckvidd för enskilda objekt, när det behövs och så länge det behövs.</p>
            <ul>
              <li>Topplacering i lista och sökresultat</li>
              <li>Förnyad annons när intresset sjunker</li>
            </ul>
          </article>
        </div>
      </Section>

      <Section label="Ingår" title="Det här ingår." intro="Allt nedan ingår utan kostnad under lanseringsperioden.">
        <RuleList items={INCLUDED} />
      </Section>

      <Section label="Frågor" title="Vanliga frågor från hyresvärdar.">
        <Faq items={FAQ} />
      </Section>
    </SiteFrame>
  );
}
