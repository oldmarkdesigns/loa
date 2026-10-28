import { expect, waitFor, within } from "storybook/test";
import { Card } from "@/components/ui/card";
import BarInteractive from "../charts/bar-interactive";
import TypeDistributionDonut from "../charts/type-distribution-donut";
import {
  BrokerRadarChart,
  ConversionFunnelChart,
  DistrictPerformanceChart,
  MetricBars,
  MetricFunnel,
  MetricGauge,
  MetricSparkline,
  SegmentTrendChart,
  WeeklyHeatmapChart
} from "./StatisticsCharts";

/**
 * The charts of the statistics page of the admin panel, drawn with Bklit UI, each on a card of its own with sample data. The
 * colours are variables with a light and a dark value, so the same stories read in both themes (toolbar "Tema").
 */
const meta = {
  title: "Components/Admin/StatisticsCharts",
  tags: ["ai-generated", "needs-work"],
  parameters: { layout: "padded" }
};

export default meta;

const Panel = ({ title, children, className = "max-w-2xl" }) => (
  <Card className={`mx-auto w-full gap-0 p-5 ${className}`}>
    <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
    <div className="mt-4">{children}</div>
  </Card>
);

const day = (offset) => new Date(2026, 8, 1 + offset);
const series = Array.from({ length: 30 }, (_, index) => ({
  date: day(index),
  views: 40 + ((index * 17) % 35) + index,
  inquiries: 6 + ((index * 5) % 9)
}));

export const ViewsAndInquiriesTotals = {
  render: () => (
    <div className="mx-auto max-w-2xl">
      <BarInteractive datasets={{ "7d": [{ label: "Nu", views: 4976, inquiries: 30 }], "30d": [{ label: "Nu", views: 4976, inquiries: 30 }], "90d": [{ label: "Nu", views: 4976, inquiries: 30 }] }} />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Registrerade totalsiffror")).toBeInTheDocument();
    await waitFor(() => expect(canvas.getByText("Nu")).toBeInTheDocument(), { timeout: 4000 });
  }
};

export const ViewsAndInquiriesOverTime = {
  render: () => (
    <div className="mx-auto max-w-2xl">
      <BarInteractive datasets={{ "7d": series.slice(-7), "30d": series, "90d": series }} />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("button", { name: "30d" })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "7d" }));
    await expect(canvas.getByRole("button", { name: "7d" })).toHaveAttribute("aria-pressed", "true");
  }
};

export const TypeDistribution = {
  render: () => (
    <div className="mx-auto max-w-sm">
      <TypeDistributionDonut
        data={[
          { key: "kontor", name: "Kontor", value: 12 },
          { key: "butik", name: "Butik", value: 7 },
          { key: "lager", name: "Lager", value: 4 },
          { key: "ovrigt", name: "Övrigt", value: 2 }
        ]}
      />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText("Kontor")).toBeInTheDocument();
    // One slice for each type of premises, and the total of them in the middle.
    await waitFor(() => expect(canvasElement.querySelectorAll("svg path").length).toBeGreaterThanOrEqual(4), { timeout: 4000 });
    await expect(canvas.getByText("objekt")).toBeInTheDocument();
  }
};

export const DistrictPerformance = {
  render: () => (
    <Panel title="Prestanda per område">
      <DistrictPerformanceChart
        data={[
          { district: "Vasastan", views: 1248, inquiries: 18 },
          { district: "Södermalm", views: 386, inquiries: 4 },
          { district: "Kungsholmen", views: 672, inquiries: 9 },
          { district: "Östermalm", views: 540, inquiries: 12 },
          { district: "Solna", views: 250, inquiries: 3 }
        ]}
      />
    </Panel>
  ),
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByText("Vasastan")).toBeInTheDocument(), { timeout: 4000 });
    await expect(canvas.getByText("Förfrågningar")).toBeInTheDocument();
  }
};

export const ConversionFunnel = {
  render: () => (
    <Panel title="Konverteringstratt" className="max-w-sm">
      <ConversionFunnelChart
        data={[
          { stage: "Visningar", count: 4976, conversion: 100 },
          { stage: "Förfrågningar", count: 420, conversion: 8 },
          { stage: "Visning bokad", count: 96, conversion: 2 },
          { stage: "Signerat avtal", count: 18, conversion: 1 }
        ]}
      />
    </Panel>
  ),
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByText("Signerat avtal")).toBeInTheDocument(), { timeout: 4000 });
  }
};

export const BrokerRadar = {
  render: () => (
    <Panel title="Mäklarprestanda" className="max-w-md">
      <BrokerRadarChart
        data={[
          { metric: "Svarstid", Anna: 82, Karl: 64 },
          { metric: "Visningar", Anna: 70, Karl: 88 },
          { metric: "Avslut", Anna: 58, Karl: 61 },
          { metric: "Nöjdhet", Anna: 91, Karl: 73 },
          { metric: "Volym", Anna: 66, Karl: 80 }
        ]}
      />
    </Panel>
  ),
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByText("Svarstid")).toBeInTheDocument(), { timeout: 4000 });
    await expect(canvas.getByText("Anna")).toBeInTheDocument();
  }
};

export const SegmentTrend = {
  render: () => (
    <Panel title="Trend per lokaltyp">
      <SegmentTrendChart
        data={Array.from({ length: 8 }, (_, index) => ({
          date: new Date(2026, index, 1),
          kontor: 40 + index * 6 + ((index * 7) % 9),
          butik: 30 + ((index * 11) % 17),
          lager: 20 + index * 2
        }))}
      />
    </Panel>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Kontor")).toBeInTheDocument();
  }
};

export const WeeklyActivity = {
  render: () => (
    <Panel title="Veckoaktivitet" className="max-w-md">
      <WeeklyHeatmapChart
        labels={["06-10", "10-14", "14-18", "18-22"]}
        rows={[
          { day: "Mån", slots: [12, 48, 61, 20] },
          { day: "Tis", slots: [15, 52, 66, 24] },
          { day: "Ons", slots: [18, 57, 70, 28] },
          { day: "Tor", slots: [14, 50, 64, 31] },
          { day: "Fre", slots: [10, 44, 52, 40] },
          { day: "Lör", slots: [5, 22, 30, 36] },
          { day: "Sön", slots: [3, 14, 19, 26] }
        ]}
      />
    </Panel>
  ),
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByText("Mån")).toBeInTheDocument(), { timeout: 4000 });
    await expect(canvas.getByText("14-18")).toBeInTheDocument();
  }
};

export const ExtendedMetrics = {
  render: () => (
    <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
      <Panel title="Trend" className="max-w-none">
        <MetricSparkline data={[12, 14, 13, 18, 22, 21, 27]} />
      </Panel>
      <Panel title="Risk (trend ned)" className="max-w-none">
        <MetricSparkline data={[30, 28, 25, 26, 20, 17, 12]} direction="down" />
      </Panel>
      <Panel title="Måluppfyllnad" className="max-w-none">
        <MetricGauge value={72} />
      </Panel>
      <Panel title="Risknivå" className="max-w-none">
        <MetricGauge value={18} inverse />
      </Panel>
      <Panel title="Tratt" className="max-w-none">
        <MetricFunnel steps={[{ label: "Förfrågan", value: 100 }, { label: "Visning", value: 62 }, { label: "Avtal", value: 24 }]} />
      </Panel>
      <Panel title="Jämförelse" className="max-w-none">
        <MetricBars items={[{ label: "Vasastan", value: 82, active: true }, { label: "Södermalm", value: 55 }, { label: "Solna", value: 31 }]} />
      </Panel>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("progressbar").length).toBe(3);
  }
};

export const Dark = {
  ...ExtendedMetrics,
  globals: { theme: "dark" }
};
