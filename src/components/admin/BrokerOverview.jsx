import { useState } from "react";
import { LayoutDashboard, SlidersHorizontal } from "lucide-react";
import { cn } from "cn";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardCustomizer from "./dashboard/DashboardCustomizer";
import useDashboardLayout from "./dashboard/useDashboardLayout";
import { SIZE_CLASS, WIDGET_VIEWS } from "./dashboard/registry";
import LiveDateTime from "./LiveDateTime";
import { visibleItems } from "../../lib/dashboardLayout";

/** What the overview shows when every widget has been switched off. */
function EmptyOverview({ onCustomize, onReset }) {
  return (
    <Card className="items-center gap-4 border-dashed border-veil/15 px-6 py-14 text-center shadow-none">
      <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-full bg-tint text-ink-600">
        <LayoutDashboard className="h-5 w-5" />
      </span>
      <div className="space-y-1">
        <h2 className="font-semibold text-strong">Din översikt är tom</h2>
        <p className="text-sm text-ink-500">Alla widgets är dolda. Välj vilka som ska visas.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={onCustomize}>Anpassa översikten</Button>
        <Button variant="outline" onClick={onReset}>
          Återställ standard
        </Button>
      </div>
    </Card>
  );
}

/**
 * The broker's overview: a greeting and a grid of widgets. Which widgets, in which order and how wide is the broker's own
 * choice ("Anpassa", see DashboardCustomizer), kept in this browser; a broker who has chosen nothing gets the default.
 */
export default function BrokerOverview({ app, listings = [], leads = [], loading, error, onRetry }) {
  const [customizing, setCustomizing] = useState(false);
  const { layout, save, reset } = useDashboardLayout(app.user?.id);
  const hour = new Date().getHours();
  const greeting = hour < 10 ? "God morgon" : hour < 18 ? "God dag" : "God kväll";
  const firstName = app.user?.name?.trim().split(/\s+/)[0] || app.user?.profile?.firstName;
  const shown = visibleItems(layout);

  return (
    <div className="space-y-6 pb-4">
      <header className="pt-1">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-strong sm:text-4xl">
            {greeting}{firstName ? `, ${firstName}` : ""}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <LiveDateTime />
            {/* The size of the date pill next to it: 34px tall, a 10px corner and 12px text. `min-h-0` and `!rounded-md` are there because
                the platform gives every button 42px and a 12px corner. */}
            <Button variant="outline" aria-haspopup="dialog" className="h-auto min-h-0 gap-2 !rounded-md px-3 py-2 text-[12px] font-medium leading-4 text-ink-700" onClick={() => setCustomizing(true)}>
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
              Anpassa
            </Button>
          </div>
        </div>
        <p className="mt-2 text-sm text-ink-600">Här är läget för dina lokaler och nästa steg framåt.</p>
      </header>

      {error ? (
        <Card role="alert" className="gap-2 p-5">
          <p>{error}</p>
          <Button variant="outline" className="w-fit" onClick={onRetry}>
            Försök igen
          </Button>
        </Card>
      ) : null}

      {shown.length ? (
        <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-12">
          {shown.map((item) => {
            const { Component } = WIDGET_VIEWS[item.id];
            return (
              <div key={item.id} data-widget={item.id} data-size={item.size} className={cn("dashboard-cell", SIZE_CLASS[item.size])}>
                <Component listings={listings} leads={leads} loading={loading} error={error} />
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyOverview onCustomize={() => setCustomizing(true)} onReset={reset} />
      )}

      <DashboardCustomizer open={customizing} onOpenChange={setCustomizing} layout={layout} onSave={save} />
    </div>
  );
}
