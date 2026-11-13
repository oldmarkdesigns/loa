import { ArrowUpRight, Bot, FilePlus2, FileText, MessageSquareText, UsersRound } from "lucide-react";
import { navigateTo, normalizeAppRole } from "../../lib/router";
import { shortcutLabel } from "../../lib/shortcuts";
import { AccountNote, AccountPage, AccountRow, AccountSection } from "./AccountLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";

/** The help of the account window: getting started (four or five steps that go to the page), the questions asked most, and how to reach us. */

// Where a step goes, for the panel the person is in (`base` is `/app/admin` or `/app/broker`).
function steps(base, isCompanyAdmin) {
  return [
    {
      key: "publish",
      Icon: FilePlus2,
      title: "Publicera din första annons",
      text: "Skriv in uppgifterna själv, eller läs in ett dokument så fylls de i åt dig. Annonsen är ett utkast tills du publicerar den.",
      action: "Publicera",
      path: "/app/publish"
    },
    ...(isCompanyAdmin
      ? [
          {
            key: "brokers",
            Icon: UsersRound,
            title: "Bjud in era mäklare",
            text: "Lägg till dem som ska publicera för bolaget. Under Adminprofil väljer ni hur de godkänns.",
            action: "Till mäklarna",
            path: `${base}/maklare`
          }
        ]
      : []),
    {
      key: "prospect",
      Icon: FileText,
      title: "Presentera en lokal med ett prospekt",
      text: "Samla bilder och text i en presentation som du delar med en länk, och samla kommentarerna på ett ställe.",
      action: "Till prospekten",
      path: `${base}/prospekt`
    },
    {
      key: "leads",
      Icon: MessageSquareText,
      title: "Följ upp intresset",
      text: "Hyresgäster som hör av sig, och de som matchar dina lokaler, samlas under Leads. Sätt en status och logga vad som hänt.",
      action: "Till leads",
      path: `${base}/leads`
    },
    {
      key: "assistant",
      Icon: Bot,
      title: "Fråga assistenten",
      text: "Den svarar utifrån era egna objekt och leads, och skriver utkast till annonstext och mejl. Den är regelbaserad och skickar ingenting utanför appen.",
      action: "Öppna assistenten",
      path: `${base}/assistent`
    }
  ];
}

export function GettingStartedPage({ app, base, onClose }) {
  const isCompanyAdmin = normalizeAppRole(app?.user?.role) === "company_admin";
  const list = steps(base, isCompanyAdmin);
  return (
    <AccountPage title="Kom igång" description={`${list.length} steg till en arbetsyta som är igång, i den ordning de brukar komma.`}>
      <AccountSection title="Stegen">
        {list.map((step, index) => (
          <AccountRow key={step.key} align="start" label={`${index + 1}. ${step.title}`} description={step.text}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-0 !rounded-md"
              onClick={() => {
                onClose?.();
                navigateTo(step.path);
              }}
            >
              {step.action}
              <ArrowUpRight aria-hidden="true" className="size-3.5" />
            </Button>
          </AccountRow>
        ))}
      </AccountSection>
      <AccountNote>Tips: {shortcutLabel("K")} söker bland alla sidor och åtgärder, så du når allt utan att leta i menyn.</AccountNote>
    </AccountPage>
  );
}

function questions(isCompanyAdmin) {
  return [
    {
      q: "Hur publicerar jag en annons?",
      a: "Välj Publicera annons: i sökningen, eller på sidan med dina annonser. Du kan skriva in uppgifterna själv eller läsa in ett dokument. En annons är ett utkast tills du publicerar den, och du kan dölja den igen när som helst."
    },
    {
      q: "Vad är skillnaden mellan mäklare och bolagsadmin?",
      a: "Mäklaren publicerar och följer upp sina egna objekt och leads. Bolagsadmin ser hela bolagets annonser, leads och mäklare, bjuder in mäklare och bestämmer reglerna under Adminprofil."
    },
    ...(isCompanyAdmin
      ? [
          {
            q: "Hur godkänns nya mäklare?",
            a: "Under Adminprofil väljer du om du godkänner varje mäklare själv, eller om en godkänd roll aktiveras direkt. Där väljer du också om annonser granskas innan de publiceras."
          }
        ]
      : []),
    {
      q: "Hur fungerar leads?",
      a: "När en hyresgäst hör av sig eller en sökprofil matchar en av dina lokaler dyker den upp under Leads. Du sätter en status, till exempel Ny, Kontaktad eller Visning bokad, och loggar samtal och nästa steg."
    },
    {
      q: "Vad är ett prospekt?",
      a: "En presentation av en lokal som du delar med en länk. Mottagaren kan kommentera, och du kan gå tillbaka till tidigare versioner. Du delar och redigerar det från panelen."
    },
    {
      q: "Vad kan AI-assistenten göra?",
      a: "Den svarar på frågor om era objekt och leads, skriver utkast till annonstext och mejl, räknar på hyra och hjälper till att läsa in dokument. Den är regelbaserad: den använder bara era egna uppgifter, och inget lämnar appen."
    },
    {
      q: "Hur byter jag mellan arbetsytan och sökläget?",
      a: "Med Växla till sökläge längst ned i sidomenyn, eller under Allmänt i det här fönstret. Tillbaka går du från profilmenyn i sökläget."
    },
    {
      q: "Hur ändrar jag tema eller sidomenyn?",
      a: "Under Allmänt. Temat gäller hela appen, också när du söker lokaler, och sidomenyn kan vara öppen, ihopfälld eller öppnas när du håller muspekaren på den."
    }
  ];
}

export function FaqPage({ app }) {
  const isCompanyAdmin = normalizeAppRole(app?.user?.role) === "company_admin";
  return (
    <AccountPage title="Vanliga frågor" description="Svar på det vi oftast får frågor om.">
      <Accordion className="border-b border-veil/10">
        {questions(isCompanyAdmin).map((item, index) => (
          <AccordionItem key={item.q} value={`fraga-${index}`} className="border-t border-veil/10">
            <AccordionTrigger className="py-4 text-[15px] font-medium text-strong hover:no-underline">{item.q}</AccordionTrigger>
            <AccordionContent className="pb-4 text-sm leading-6 text-ink-600">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </AccountPage>
  );
}

export function ContactPage({ onOpenPage }) {
  return (
    <AccountPage title="Kontakt" description="Så når du oss, och vad vi behöver veta.">
      <AccountSection title="Kundservice">
        <AccountRow label="E-post" description="För frågor om konto, annonser och leads.">
          <a className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-0 !rounded-md")} href="mailto:support@foretag.se">
            support@foretag.se
          </a>
        </AccountRow>
        <AccountRow label="Telefon">
          <a className="font-medium text-strong hover:underline" href="tel:0812345678">08-123 45 67</a>
        </AccountRow>
        <AccountRow label="Öppettider">
          <span>Vardagar 08:00–17:00</span>
        </AccountRow>
      </AccountSection>

      <AccountSection title="När något inte fungerar" description="Det här hjälper oss hitta felet snabbt.">
        <ul className="list-disc space-y-2 pl-5 pt-4 text-sm leading-6 text-ink-600 marker:text-ink-400">
          <li>Skriv vilken sida du var på och vad du försökte göra.</li>
          <li>Berätta vad som hände, och vad du väntade dig.</li>
          <li>Bifoga en skärmbild om du kan.</li>
        </ul>
        <div className="pt-5">
          <Button type="button" variant="outline" className="min-h-0" onClick={() => onOpenPage?.("fragor")}>
            Läs vanliga frågor först
          </Button>
        </div>
      </AccountSection>

      <AccountNote>LOA © {new Date().getFullYear()}</AccountNote>
    </AccountPage>
  );
}
