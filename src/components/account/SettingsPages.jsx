import { navigateTo, normalizeAppRole } from "../../lib/router";
import { SIDEBAR_MODES, useSidebarMode } from "../../lib/sidebarDisplay";
import { shortcutLabel, usesCommandKey } from "../../lib/shortcuts";
import { usePanelChrome, switchToSearchMode } from "../layout/PanelChrome";
import { ThemeToggle } from "../layout/ThemeToggle";
import { AccountNote, AccountPage, AccountRow, AccountSection } from "./AccountLayout";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** The settings of the account window: how the workspace looks and works (Allmänt), and the keyboard shortcuts (Genvägar). */

const SIDEBAR_LABELS = {
  expanded: { label: "Expanderad", help: "Menyn är alltid öppen." },
  collapsed: { label: "Ihopfälld", help: "Menyn visar bara ikonerna, och öppnas med knappen eller med genvägen." },
  hover: { label: "Expandera vid hovring", help: "Menyn visar bara ikonerna och öppnas över sidan när muspekaren är på den." }
};

const ROLE_LABELS = { company_admin: "Bolagsadmin", broker: "Mäklare", renter: "Hyresgäst" };

export function GeneralSettingsPage({ app }) {
  const chrome = usePanelChrome();
  const { mode, setMode } = useSidebarMode();
  const role = normalizeAppRole(app?.user?.role);

  return (
    <AccountPage title="Allmänt" description="Hur arbetsytan ser ut och beter sig, och ditt konto.">
      <AccountSection title="Utseende">
        <AccountRow label="Tema" description="Ljust, mörkt, eller som din dator har det. Gäller hela appen, också när du söker lokaler.">
          <div className="flex sm:justify-end">
            <ThemeToggle />
          </div>
        </AccountRow>
        <AccountRow label="Sidomeny" description={SIDEBAR_LABELS[mode]?.help} htmlFor="setting-sidebar" field>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger id="setting-sidebar" className="w-full text-left">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIDEBAR_MODES.map((value) => (
                <SelectItem key={value} value={value}>{SIDEBAR_LABELS[value].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </AccountRow>
      </AccountSection>

      <AccountSection title="Konto">
        <AccountRow label="Roll" description="Vad du gör i arbetsytan.">
          <span className="font-medium text-strong">{ROLE_LABELS[role] || "Mäklare"}</span>
        </AccountRow>
        <AccountRow label="Sökläge" description="Sök lokaler som hyresgäst. Du växlar tillbaka från profilmenyn i sökläget.">
          <Button type="button" variant="outline" className="min-h-0" onClick={() => switchToSearchMode(chrome)}>
            Växla till sökläge
          </Button>
        </AccountRow>
        <AccountRow label="Logga ut" description="Du loggas ut på den här enheten.">
          <Button
            type="button"
            variant="outline"
            className="min-h-0"
            onClick={async () => {
              await app?.logout?.();
              navigateTo("/", { replace: true });
            }}
          >
            Logga ut
          </Button>
        </AccountRow>
      </AccountSection>
    </AccountPage>
  );
}

function Keys({ children }) {
  return <span className="inline-flex items-center gap-1">{children}</span>;
}

export function ShortcutsPage() {
  const modifier = usesCommandKey() ? "⌘" : "Ctrl";
  return (
    <AccountPage title="Tangentbordsgenvägar" description="Snabbare väg genom arbetsytan.">
      <AccountSection title="Arbetsytan">
        <AccountRow label="Sök" description="Sök bland sidor och åtgärder, och gå dit direkt.">
          <Keys><Kbd>{shortcutLabel("K")}</Kbd></Keys>
        </AccountRow>
        <AccountRow label="Sidomenyn" description="Fäll ihop menyn, eller öppna den igen.">
          <Keys><Kbd>{shortcutLabel("B")}</Kbd></Keys>
        </AccountRow>
      </AccountSection>
      <AccountSection title="Sökningen och fönster">
        <AccountRow label="Bläddra" description="Flytta mellan träffarna, och välj den du står på.">
          <Keys><Kbd>↑</Kbd><Kbd>↓</Kbd><Kbd>Enter</Kbd></Keys>
        </AccountRow>
        <AccountRow label="Stäng" description="Stäng sökningen, en meny eller det här fönstret.">
          <Keys><Kbd>Esc</Kbd></Keys>
        </AccountRow>
      </AccountSection>
      <AccountNote>
        {modifier}B fungerar inte medan du skriver i ett fält, och ingen av genvägarna fungerar när ett fönster, som det här, är öppet.
      </AccountNote>
    </AccountPage>
  );
}
