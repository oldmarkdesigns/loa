import { useEffect, useMemo, useRef, useState } from "react";
import { Building2 } from "lucide-react";
import { APPROVAL_FLOW_OPTIONS, COMPANY_TYPE_OPTIONS, LISTING_MODERATION_OPTIONS, PORTFOLIO_SIZE_OPTIONS } from "../../lib/companyProfileOptions";
import { AccountPage, AccountRow, AccountSection } from "./AccountLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

/**
 * The company admin's page of the account window: the company (name, number, type, size, logo, description, contacts), and the two
 * rules for the company's brokers (how they are approved, and whether a listing is looked at before it is published). It is the
 * page that used to fill the panel as "Adminprofil", in rows instead of a form: what it is to the left, the field to the right, and
 * one bar at the bottom that saves it all (it is there only while something has changed).
 */

const emptyDraft = {
  legalEntity: "",
  organizationNumber: "",
  companyType: "",
  portfolioSize: "",
  logoUrl: "",
  companyDescription: "",
  websiteUrl: "",
  contactEmail: "",
  approvedEmailDomain: "",
  approvalFlow: "admin_approves_broker",
  listingModeration: "broker_publishes_direct",
  termsAdminAuthority: false,
  termsPlatformRules: false
};

const draftFromUser = (user) => ({
  legalEntity: user?.profile?.legalEntity || user?.profile?.companyName || "",
  organizationNumber: user?.profile?.organizationNumber || "",
  companyType: user?.profile?.companyType || "",
  portfolioSize: user?.profile?.portfolioSize || "",
  logoUrl: user?.profile?.logoUrl || "",
  companyDescription: user?.profile?.companyDescription || "",
  websiteUrl: user?.profile?.websiteUrl || "",
  contactEmail: user?.profile?.contactEmail || user?.email || "",
  approvedEmailDomain: user?.profile?.approvedEmailDomain || "",
  approvalFlow: user?.profile?.approvalFlow || emptyDraft.approvalFlow,
  listingModeration: user?.profile?.listingModeration || emptyDraft.listingModeration,
  termsAdminAuthority: Boolean(user?.profile?.termsAdminAuthority),
  termsPlatformRules: Boolean(user?.profile?.termsPlatformRules)
});

function ChoiceSelect({ id, value, options, onChange, placeholder }) {
  const items = options.map((option) => (typeof option === "string" ? { value: option, label: option } : { value: option.key, label: option.title }));
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full text-left">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function CompanyProfilePage({ app }) {
  const user = app?.user;
  const saved = useMemo(() => draftFromUser(user), [user?.email, user?.profile]);
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);
  const logoInput = useRef(null);
  useEffect(() => setDraft(saved), [saved]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const set = (key) => (value) => setDraft((prev) => ({ ...prev, [key]: value }));
  const onInput = (key) => (event) => set(key)(event.target.value);
  const approval = APPROVAL_FLOW_OPTIONS.find((option) => option.key === draft.approvalFlow);
  const moderation = LISTING_MODERATION_OPTIONS.find((option) => option.key === draft.listingModeration);

  async function save() {
    if (!app?.updateProfile) {
      app?.pushToast?.("Kunde inte spara adminprofilen just nu.", "error");
      return;
    }
    setSaving(true);
    try {
      const legalEntity = String(draft.legalEntity || "").trim();
      await app.updateProfile({
        profile: {
          ...(user?.profile || {}),
          legalEntity,
          companyName: legalEntity,
          organizationNumber: String(draft.organizationNumber || "").trim(),
          companyType: String(draft.companyType || "").trim(),
          portfolioSize: String(draft.portfolioSize || "").trim(),
          logoUrl: String(draft.logoUrl || "").trim(),
          companyDescription: String(draft.companyDescription || "").trim(),
          websiteUrl: String(draft.websiteUrl || "").trim(),
          contactEmail: String(draft.contactEmail || "").trim(),
          approvedEmailDomain: String(draft.approvedEmailDomain || "").trim(),
          approvalFlow: draft.approvalFlow,
          listingModeration: draft.listingModeration,
          termsAdminAuthority: Boolean(draft.termsAdminAuthority),
          termsPlatformRules: Boolean(draft.termsPlatformRules)
        }
      });
      app?.pushToast?.("Adminprofil uppdaterad.", "success");
    } catch (error) {
      app?.pushToast?.(error.message || "Kunde inte spara adminprofilen.", "error");
    } finally {
      setSaving(false);
    }
  }

  function readLogo(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("logoUrl")(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  return (
    <AccountPage title="Adminprofil" description="Uppgifter om bolaget och reglerna för era mäklare och annonser.">
      <AccountSection title="Bolaget">
        <AccountRow label="Logotyp" description="PNG, SVG eller JPG, helst 400 × 400 px.">
          <div className="flex items-center gap-3 sm:justify-end">
            <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-veil/10 bg-control text-ink-500">
              {draft.logoUrl ? <img src={draft.logoUrl} alt="Bolagets logotyp" className="size-full object-cover" /> : <Building2 aria-hidden="true" className="size-5" />}
            </span>
            <Button type="button" variant="outline" size="sm" className="min-h-0 !rounded-md" onClick={() => logoInput.current?.click()}>
              {draft.logoUrl ? "Byt logotyp" : "Ladda upp"}
            </Button>
            <input ref={logoInput} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" className="hidden" aria-label="Ladda upp logotyp" onChange={readLogo} />
            {draft.logoUrl ? (
              <Button type="button" variant="ghost" size="sm" className="min-h-0 !rounded-md text-ink-600" onClick={() => set("logoUrl")("")}>
                Ta bort
              </Button>
            ) : null}
          </div>
        </AccountRow>
        <AccountRow label="Bolagsnamn" htmlFor="company-name" field>
          <Input id="company-name" value={draft.legalEntity} onChange={onInput("legalEntity")} />
        </AccountRow>
        <AccountRow label="Organisationsnummer" htmlFor="company-orgnr" field>
          <Input id="company-orgnr" value={draft.organizationNumber} onChange={onInput("organizationNumber")} />
        </AccountRow>
        <AccountRow label="Bolagstyp" htmlFor="company-type" field>
          <ChoiceSelect id="company-type" value={draft.companyType} options={COMPANY_TYPE_OPTIONS} onChange={set("companyType")} placeholder="Välj bolagstyp" />
        </AccountRow>
        <AccountRow label="Portföljstorlek" htmlFor="company-portfolio" field>
          <ChoiceSelect id="company-portfolio" value={draft.portfolioSize} options={PORTFOLIO_SIZE_OPTIONS} onChange={set("portfolioSize")} placeholder="Välj storlek" />
        </AccountRow>
        <AccountRow label="Beskrivning" description="Visas för hyresgäster på bolagets annonser." htmlFor="company-description" field align="start">
          <Textarea id="company-description" className="min-h-24" value={draft.companyDescription} onChange={onInput("companyDescription")} />
        </AccountRow>
      </AccountSection>

      <AccountSection title="Kontakt">
        <AccountRow label="Webbplats" htmlFor="company-website" field>
          <Input id="company-website" value={draft.websiteUrl} onChange={onInput("websiteUrl")} />
        </AccountRow>
        <AccountRow label="Kontaktmejl" htmlFor="company-contact" field>
          <Input id="company-contact" type="email" value={draft.contactEmail} onChange={onInput("contactEmail")} />
        </AccountRow>
        <AccountRow label="Godkänd e-postdomän" description="Mäklare med en adress på domänen kan bjudas in utan extra kontroll." htmlFor="company-domain" field>
          <Input id="company-domain" placeholder="bolaget.se" value={draft.approvedEmailDomain} onChange={onInput("approvedEmailDomain")} />
        </AccountRow>
      </AccountSection>

      <AccountSection title="Mäklare och annonser" description="Reglerna gäller alla mäklare i bolaget.">
        <AccountRow label="Godkännande av mäklare" description={approval?.description} htmlFor="company-approval" field>
          <ChoiceSelect id="company-approval" value={draft.approvalFlow} options={APPROVAL_FLOW_OPTIONS} onChange={set("approvalFlow")} />
        </AccountRow>
        <AccountRow label="Granskning av annonser" description={moderation?.description} htmlFor="company-moderation" field>
          <ChoiceSelect id="company-moderation" value={draft.listingModeration} options={LISTING_MODERATION_OPTIONS} onChange={set("listingModeration")} />
        </AccountRow>
      </AccountSection>

      {dirty ? (
        <div className="sticky bottom-0 z-10 -mx-2 flex items-center justify-between gap-3 rounded-xl border border-veil/10 bg-popover px-4 py-3">
          <p className="text-sm text-ink-600">Du har ändringar som inte är sparade.</p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" className="min-h-0" disabled={saving} onClick={() => setDraft(saved)}>
              Ångra
            </Button>
            <Button type="button" className="min-h-0" disabled={saving} onClick={save}>
              {saving ? "Sparar..." : "Spara ändringar"}
            </Button>
          </div>
        </div>
      ) : null}
    </AccountPage>
  );
}
