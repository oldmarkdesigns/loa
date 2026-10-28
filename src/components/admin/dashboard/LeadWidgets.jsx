import { useMemo, useState } from "react";
import { Area, AreaChart, Background, ChartTooltip, FunnelChart, Gauge, Ring, RingCenter, RingChart, XAxis } from "@/components/charts";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { dayKey, fitDistribution, followUpSchedule, leadFunnel, leadPipeline, leadTrend } from "../../../lib/brokerDashboard";
import ColumnChart from "./ColumnChart";
import {
  WidgetBody,
  WidgetCard,
  number,
  percent,
  rangeToggleClass,
  rangeToggleItemClass
} from "./WidgetCard";

/** The widgets about the broker's leads. All take `{ listings, leads, loading, error }`. */

export function LeadTrendWidget({ leads, loading, error }) {
  const [days, setDays] = useState(30);
  const today = dayKey(new Date());
  const trend = useMemo(() => leadTrend(leads, days), [leads, days, today]);

  return (
    <WidgetCard
      title="Intresse över tid"
      subtitle="Nya leads per dag"
      action={
        <ToggleGroup
          aria-label="Tidsperiod för leads"
          value={[String(days)]}
          onValueChange={(value) => value[0] && setDays(Number(value[0]))}
          className={rangeToggleClass}
        >
          {[7, 30, 90].map((value) => (
            <ToggleGroupItem key={value} value={String(value)} className={rangeToggleItemClass} aria-label={`Senaste ${value} dagarna`}>
              {value} dagar
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      }
      headline={loading || error ? "—" : number(trend.total)}
      headlineNote="leads under perioden"
      footer={
        <>
          {trend.total ? "Baserat på när dina leads skapades." : "Inga nya leads under perioden. Kurvan visar faktiska registreringar."}
          {trend.undated > 0 ? ` ${trend.undated} leads saknar datum och ingår inte i kurvan.` : ""}
        </>
      }
    >
      <WidgetBody loading={loading} error={error} minHeight={220}>
        <AreaChart data={trend.points} aspectRatio="auto" margin={{ top: 12, right: 8, bottom: 30, left: 8 }} className="min-h-[220px] w-full flex-1">
          <Background pattern="dots" />
          <Area dataKey="leads" />
          <XAxis />
          <ChartTooltip rows={(point) => [{ color: "var(--chart-line-primary)", label: "Nya leads", value: point.leads }]} />
        </AreaChart>
      </WidgetBody>
    </WidgetCard>
  );
}

/** The colour of the nth series of Bklit's chart palette, which a ring or a slice takes in order. */
const paletteColor = (index) => `var(--chart-${(index % 5) + 1})`;

export function PipelineWidget({ leads, loading, error }) {
  const pipeline = leadPipeline(leads);
  // One ring for each step, filled by its share of all the leads.
  const rings = pipeline.stages.map((stage) => ({ label: stage.label, value: stage.value, maxValue: Math.max(1, pipeline.total) }));

  return (
    <WidgetCard
      title="Leads per steg"
      subtitle="Var dina leads står just nu"
      headline={loading || error ? "—" : number(pipeline.open)}
      headlineNote="pågående leads"
      footer={pipeline.total ? `${number(pipeline.total)} leads totalt, varav ${number(pipeline.total - pipeline.open)} är avslutade.` : undefined}
    >
      <WidgetBody loading={loading} error={error} empty={!pipeline.total} emptyText="Inga leads ännu. De dyker upp här när någon hör av sig." minHeight={200}>
        <div className="dashboard-split">
          <div className="mx-auto flex w-full max-w-[220px] justify-center">
            <RingChart data={rings} size={220} strokeWidth={8} ringGap={4} baseInnerRadius={40}>
              {rings.map((ring, index) => (
                <Ring key={ring.label} index={index} showGlow={false} />
              ))}
              <RingCenter defaultLabel="leads" />
            </RingChart>
          </div>
          <ul aria-label="Leads per steg" className="space-y-2 text-sm">
            {pipeline.stages.map((stage, index) => (
              <li key={stage.key} className={`flex items-center justify-between gap-3 ${stage.value ? "" : "text-ink-400"}`}>
                <span className="inline-flex min-w-0 items-center gap-2 text-ink-700">
                  <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: paletteColor(index) }} />
                  <span className="truncate">{stage.label}</span>
                </span>
                <span className="font-semibold tabular-nums text-ink-900">{number(stage.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      </WidgetBody>
    </WidgetCard>
  );
}

export function FunnelWidget({ listings, leads, loading, error }) {
  const funnel = leadFunnel(listings, leads);
  const steps = funnel.steps.map((step) => ({ label: step.label, value: step.value }));

  return (
    <WidgetCard
      title="Konvertering"
      subtitle="Hur långt dina leads kommer"
      headline={loading || error ? "—" : funnel.winRate === null ? "—" : percent(funnel.winRate)}
      headlineNote="av leadsen blir vunna"
      footer={
        !funnel.views
          ? "Inga registrerade annonsvisningar ännu."
          : funnel.viewToLeadRate === null
            ? `Det finns fler leads än registrerade annonsvisningar (${number(funnel.views)}), så andelen går inte att räkna ut.`
            : `${percent(funnel.viewToLeadRate)} av ${number(funnel.views)} annonsvisningar blev leads.`
      }
    >
      <WidgetBody loading={loading} error={error} empty={!funnel.steps[0].value} emptyText="Ingen konvertering att visa ännu. Den räknas ut när du har leads." minHeight={200}>
        <FunnelChart data={steps} formatValue={number} style={{ aspectRatio: "1.5 / 1" }} />
      </WidgetBody>
    </WidgetCard>
  );
}

export function FollowUpsWidget({ leads, loading, error }) {
  const today = dayKey(new Date());
  const schedule = useMemo(() => followUpSchedule(leads), [leads, today]);
  const data = [
    ...(schedule.overdue ? [{ label: "Sen", title: "Försenade uppföljningar", value: schedule.overdue, tone: "late" }] : []),
    ...schedule.buckets.map((bucket) => ({ label: bucket.label, title: bucket.longLabel, value: bucket.value, tone: bucket.today ? "today" : undefined }))
  ];
  const notes = [
    schedule.overdue ? `${schedule.overdue} försenade` : null,
    schedule.later ? `${schedule.later} senare än två veckor` : null
  ].filter(Boolean);

  return (
    <WidgetCard
      title="Kommande uppföljningar"
      subtitle="De närmaste 14 dagarna"
      headline={loading || error ? "—" : number(schedule.upcoming)}
      headlineNote="att följa upp"
      footer={notes.length ? notes.join(" · ") : undefined}
    >
      <WidgetBody loading={loading} error={error} empty={!schedule.total} emptyText="Inga planerade uppföljningar. Sätt ett datum på ett lead så syns det här." minHeight={200}>
        <ColumnChart data={data} seriesLabel="Uppföljningar" />
      </WidgetBody>
    </WidgetCard>
  );
}

export function LeadFitWidget({ leads, loading, error }) {
  const fit = fitDistribution(leads);

  return (
    <WidgetCard
      title="Leadens matchning"
      subtitle="Hur väl leadsen passar lokalerna"
      headline={loading || error ? "—" : fit.average === null ? "—" : `${fit.average} %`}
      headlineNote="i snitt"
      footer={fit.count ? `Baserat på ${number(fit.count)} leads med matchningspoäng.` : undefined}
    >
      <WidgetBody loading={loading} error={error} empty={!fit.count} emptyText="Inga leads med matchningspoäng ännu." minHeight={200}>
        <div className="flex flex-col gap-4">
          <Gauge value={fit.average ?? 0} defaultLabel="i snitt" suffix=" %" minWidth={0} />
          <ul aria-label="Leads per matchningsnivå" className="space-y-2 text-sm">
            {fit.buckets.map((bucket) => (
              <li key={bucket.key} className="flex items-center justify-between gap-3">
                <span className="text-ink-700">{bucket.label}</span>
                <span className="font-semibold tabular-nums text-ink-900">{number(bucket.value)} st</span>
              </li>
            ))}
          </ul>
        </div>
      </WidgetBody>
    </WidgetCard>
  );
}
