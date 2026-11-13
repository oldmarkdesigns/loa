import { Building2, History, Mail, Phone, StickyNote, Users, CalendarCheck } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import StatusPill from "./StatusPill";
import { formatSek } from "../../lib/formatters";

// Shared by every card in the lead overlay: flat, hairline border only (the app uses no shadows).
export const leadCardClass = "shadow-none";
const titleClass = "text-[11px] font-semibold text-ink-500";

const activityStyles = {
  call: { Icon: Phone, className: "bg-blue-50 text-blue-700" },
  email: { Icon: Mail, className: "bg-indigo-50 text-indigo-700" },
  meeting: { Icon: Users, className: "bg-amber-50 text-amber-700" },
  viewing: { Icon: CalendarCheck, className: "bg-emerald-50 text-emerald-700" },
  note: { Icon: StickyNote, className: "bg-veil/[0.05] text-ink-700" }
};

/** Which listing the lead is about, at a glance: photo, place, size and rent, and where the lead stands. */
export function LeadInterestCard({ lead, followUp }) {
  const listing = lead.listing || {};
  const status = lead.status || "new";
  const cover = listing.image || listing.images?.[0];
  const place = [listing.district, listing.type].filter(Boolean).join(" · ");
  const specs = [Number(listing.sizeSqm) > 0 ? `${listing.sizeSqm} kvm` : "", Number(listing.priceMonthly) > 0 ? `${formatSek(listing.priceMonthly)} / mån` : ""].filter(Boolean).join(" · ");

  return (
    <Card className={cn("shrink-0 gap-0 p-0", leadCardClass)}>
      <div className="px-4 pb-3 pt-4">
        <h3 className="sr-only">Intresse för objekt</h3>
        <div className="flex items-center gap-3">
          {cover ? (
            <img src={cover} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-veil/10" />
          ) : (
            <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-control text-ink-500 ring-1 ring-veil/10">
              <Building2 className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-base font-semibold leading-tight text-ink-900">{listing.title || "Objekt"}</p>
            {place ? <p className="mt-0.5 truncate text-xs text-ink-600">{place}</p> : null}
            {specs ? <p className="truncate text-xs font-medium text-ink-700">{specs}</p> : null}
          </div>
        </div>
      </div>
      <div className="space-y-3 px-4 pb-4 pt-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <StatusPill status={status} />
          {followUp ? <span className={cn("text-xs font-medium", followUp.overdue ? "text-rose-600" : "text-ink-500")}>Uppföljning {followUp.label}</span> : null}
        </div>
        {lead.renter?.email ? (
          <p className="flex items-center gap-2 text-xs text-ink-600">
            <Mail className="h-3.5 w-3.5 shrink-0 text-ink-500" />
            <span className="min-w-0 truncate">{lead.renter.email}</span>
          </p>
        ) : null}
      </div>
    </Card>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4" aria-label="Laddar aktivitetslogg" role="status">
      {[0, 1].map((row) => (
        <div key={row} className="flex animate-pulse gap-3">
          <span className="h-8 w-8 shrink-0 rounded-full bg-veil/[0.06]" />
          <span className="flex-1 space-y-2 pt-1">
            <span className="block h-3 w-4/5 rounded bg-veil/[0.06]" />
            <span className="block h-2.5 w-1/3 rounded bg-veil/[0.05]" />
          </span>
        </div>
      ))}
    </div>
  );
}

/** Everything that has happened with the lead, newest first, as a timeline with a coloured icon per kind of contact. */
export function LeadActivityLog({ activities, loading, freshId }) {
  return (
    <Card className={cn("min-h-[12rem] flex-1 gap-3 p-4 md:min-h-0", leadCardClass)}>
      <div className="flex shrink-0 items-center justify-between gap-3">
        <h3 className={titleClass}>Aktivitetslogg</h3>
        <Badge variant="outline" className="h-auto rounded-full bg-subtle px-2 py-0.5 text-xs font-semibold text-ink-700">
          {activities.length}
        </Badge>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {loading ? <TimelineSkeleton /> : null}
        {!loading && activities.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 px-2 py-6 text-center">
            <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-veil/[0.05] text-ink-500">
              <History className="h-5 w-5" />
            </span>
            <p className="max-w-[16rem] text-sm text-ink-600">Ingen aktivitet ännu. Berätta för assistenten vad som hänt så loggas det här.</p>
          </div>
        ) : null}
        {!loading && activities.length > 0 ? (
          <ol>
            {activities.map((activity, index) => {
              const { Icon, className } = activityStyles[activity.type] || activityStyles.note;
              const fresh = activity.id === freshId;
              return (
                <li key={activity.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {index < activities.length - 1 ? <span aria-hidden="true" className="absolute bottom-0 left-4 top-9 -ml-px w-px bg-veil/10" /> : null}
                  <span className={cn("relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-surface", className)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className={cn("min-w-0 flex-1 rounded-lg pt-0.5", fresh && "-my-1 bg-emerald-50 px-2 py-1.5 animate-in fade-in-0 slide-in-from-top-2 duration-500")}>
                    <p className="break-words text-sm font-medium leading-snug text-ink-900">{activity.body}</p>
                    <p className="mt-0.5 text-xs text-ink-500">{activity.label} · {activity.when}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : null}
      </div>
    </Card>
  );
}
