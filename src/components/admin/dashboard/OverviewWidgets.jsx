import { ArrowUpRight, Building2, Clock3, Eye, FileText, MessageSquare, Plus, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrokerAssistantCard } from "../../app/BrokerAssistant";
import { brokerMetrics } from "../../../lib/brokerDashboard";
import { navigateTo } from "../../../lib/router";
import { number } from "./WidgetCard";

/** The widgets that are not charts: the shortcuts, the key figures and the assistant's next steps. */

const quickActions = [
  { title: "Ny annons", description: "Lägg till en lokal", icon: Plus, path: "/app/publish" },
  { title: "Hantera objekt", description: "Redigera och publicera", icon: Building2, path: "/app/broker/objekt" },
  { title: "Skapa prospekt", description: "Presentera dina lokaler", icon: FileText, path: "/app/broker/prospekt" },
  { title: "Öppna inkorgen", description: "Fortsätt dialogen", icon: MessageSquare, path: "/app/broker/meddelanden" }
];

export function QuickActionsWidget() {
  return (
    <section aria-label="Snabbåtgärder" className="dashboard-quick-actions">
      {quickActions.map(({ title, description, icon: Icon, path }, index) => (
        <Button
          key={path}
          variant="outline"
          className={`group h-auto min-w-0 justify-start gap-3 whitespace-normal rounded-xl p-4 text-left shadow-none ${index === 0 ? "border-strong bg-strong text-on-strong hover:bg-strong/90 hover:text-on-strong" : "bg-control"}`}
          onClick={() => navigateTo(path)}
        >
          <span
            className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:flex ${index === 0 ? "bg-on-strong/10" : "bg-tint text-ink-700"}`}
          >
            <Icon className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{title}</span>
            <span className={`mt-1 block text-xs font-normal ${index === 0 ? "text-on-strong/65" : "text-ink-500"}`}>{description}</span>
          </span>
          <ArrowUpRight className="hidden h-4 w-4 shrink-0 opacity-50 sm:block" />
        </Button>
      ))}
    </section>
  );
}

export function KeyFiguresWidget({ listings, leads, loading, error }) {
  const stats = brokerMetrics(listings, leads);
  const metrics = [
    {
      label: "Aktiva objekt",
      value: number(stats.activeCount),
      detail: `${stats.draftCount} utkast · ${stats.listingCount} objekt totalt`,
      icon: Building2
    },
    { label: "Visningar totalt", value: number(stats.totalViews), detail: "Registrerade annonsvisningar", icon: Eye },
    { label: "Inkomna leads", value: number(stats.leadCount), detail: `${stats.newLeadCount} nya att följa upp`, icon: Users },
    {
      label: "Snittsvarstid",
      value: stats.responseHours === null ? "—" : `${stats.responseHours} h`,
      detail: stats.responseHours === null ? "Ingen svarstidsdata ännu" : "Genomsnitt för objekt med data",
      icon: Clock3
    }
  ];

  return (
    <Card aria-label="Nyckeltal" aria-busy={loading} className="h-full gap-0 py-0">
      <div className="dashboard-kpis flex-1">
        {metrics.map(({ label, value, detail, icon: Icon }) => (
          <div key={label} className="min-w-0 bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-ink-600 sm:text-sm">{label}</span>
              <Icon className="h-4 w-4 shrink-0 text-ink-400" />
            </div>
            <p className="my-3 text-3xl font-semibold tracking-tight tabular-nums text-strong">{loading || error ? "—" : value}</p>
            <p className="text-xs leading-relaxed text-ink-500">
              {loading ? "Laddar uppgifter…" : error ? "Uppgifter kunde inte hämtas" : detail}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function NextStepsWidget({ listings, leads, loading, error }) {
  return <BrokerAssistantCard listings={listings} leads={leads} loading={loading} error={error} className="h-full" />;
}
