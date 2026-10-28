import {
  Banknote,
  CalendarClock,
  ChartPie,
  Funnel,
  Gauge,
  Hourglass,
  SquareKanban,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap
} from "lucide-react";
import { FollowUpsWidget, FunnelWidget, LeadFitWidget, LeadTrendWidget, PipelineWidget } from "./LeadWidgets";
import { ListingAgeWidget, ListingStatusWidget, RentByDistrictWidget, TopListingsWidget } from "./ListingWidgets";
import { KeyFiguresWidget, NextStepsWidget, QuickActionsWidget } from "./OverviewWidgets";

/**
 * What each widget of lib/dashboardLayout looks like on screen: its icon (in the customizer) and the component that draws it.
 * Every component takes `{ listings, leads, loading, error }`.
 */
export const WIDGET_VIEWS = {
  "quick-actions": { icon: Zap, Component: QuickActionsWidget },
  "key-figures": { icon: Gauge, Component: KeyFiguresWidget },
  "lead-trend": { icon: TrendingUp, Component: LeadTrendWidget },
  "next-steps": { icon: Sparkles, Component: NextStepsWidget },
  pipeline: { icon: SquareKanban, Component: PipelineWidget },
  funnel: { icon: Funnel, Component: FunnelWidget },
  "listing-status": { icon: ChartPie, Component: ListingStatusWidget },
  "top-listings": { icon: Trophy, Component: TopListingsWidget },
  "follow-ups": { icon: CalendarClock, Component: FollowUpsWidget },
  "rent-by-district": { icon: Banknote, Component: RentByDistrictWidget },
  "lead-fit": { icon: Target, Component: LeadFitWidget },
  "listing-age": { icon: Hourglass, Component: ListingAgeWidget }
};

/**
 * The columns of the 12-column grid each size takes: on a phone every widget has the whole width, from a tablet a small one
 * has half of it, and from a wide screen the sizes are a third, a half, two thirds and all of it. (The classes are written
 * out in full so that Tailwind finds them.)
 */
export const SIZE_CLASS = {
  small: "md:col-span-6 xl:col-span-4",
  medium: "md:col-span-6",
  large: "md:col-span-12 xl:col-span-8",
  full: "md:col-span-12"
};
