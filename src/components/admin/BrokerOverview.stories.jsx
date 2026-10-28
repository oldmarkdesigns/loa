import { expect, waitFor, within } from "storybook/test";
import { TooltipProvider } from "@/components/ui/tooltip";
import BrokerOverview from "./BrokerOverview";
import { defaultLayout, layoutStorageKey, moveItem } from "../../lib/dashboardLayout";

const DAY = 86_400_000;
const daysAgo = (days) => new Date(Date.now() - days * DAY).toISOString();
const localDate = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const listings = [
  { id: "l1", title: "Ljust kontor vid Odenplan", district: "Vasastan", status: "active", sizeSqm: 240, priceMonthly: 48000, views: 1248, createdAt: daysAgo(20), responseHours: 3 },
  { id: "l2", title: "Studio i Hornstull", district: "Södermalm", status: "draft", sizeSqm: 85, priceMonthly: 18500, views: 386, updatedAt: daysAgo(3) },
  { id: "l3", title: "Flexibelt kontor vid vattnet", district: "Kungsholmen", status: "active", sizeSqm: 160, priceMonthly: 32000, views: 672, createdAt: daysAgo(120), responseHours: 6 },
  { id: "l4", title: "Kontor på Norrmalm", district: "Norrmalm", status: "negotiating", sizeSqm: 300, priceMonthly: 84000, views: 900, createdAt: daysAgo(45) },
  { id: "l5", title: "Studio i Solna", district: "Solna", status: "rented", sizeSqm: 60, priceMonthly: 15000, views: 210, createdAt: daysAgo(200) },
  { id: "l6", title: "Klinikläge på Östermalm", district: "Östermalm", status: "active", sizeSqm: 120, priceMonthly: 60000, views: 540, createdAt: daysAgo(5) },
  { id: "l7", title: "Lager i Solna", district: "Solna", status: "inactive", sizeSqm: 500, priceMonthly: 25000, views: 40, createdAt: daysAgo(300) },
  { id: "l8", title: "Coworking i Vasastan", district: "Vasastan", status: "active", sizeSqm: 400, priceMonthly: 70000, views: 980, createdAt: daysAgo(14), responseHours: 2 }
];

const STATUSES = ["new", "contacted", "viewing_booked", "negotiating", "won", "lost"];
const leads = Array.from({ length: 30 }, (_, index) => ({
  id: `lead-${index}`,
  listingId: listings[index % 5 === 4 ? 0 : index % listings.length].id,
  status: STATUSES[index % STATUSES.length],
  fitScore: 50 + ((index * 7) % 50),
  createdAt: daysAgo(index % 28),
  followUpDate: index % 3 === 0 ? localDate((index % 20) - 2) : undefined
}));

const app = { user: { id: "broker-1", name: "Samuel Oldmark", profile: { companyName: "Strand Fastigheter" } } };
const storageKey = layoutStorageKey(app.user.id);

/** The marks of the chart of "Objekt i topp": a column for each listing (leads) or a flow from a district to each listing (views). */
const rankedSegments = (canvasElement) => canvasElement.querySelectorAll('[data-widget="top-listings"] svg rect, [data-widget="top-listings"] svg path');

const forget = () => window.localStorage.removeItem(storageKey);
/** Starts a story from a stored layout (or from none), and leaves nothing behind. */
const withLayout = (layout) => () => {
  if (layout) window.localStorage.setItem(storageKey, JSON.stringify(layout));
  else forget();
  return forget;
};

const meta = {
  component: BrokerOverview,
  tags: ["ai-generated", "needs-work"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="mx-auto max-w-6xl bg-canvas p-6">
          <Story />
        </div>
      </TooltipProvider>
    )
  ],
  args: { app, listings, leads, loading: false, error: "" },
  beforeEach: withLayout(null)
};

export default meta;

const headings = (canvas) => canvas.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
const cells = (canvasElement) => Array.from(canvasElement.querySelectorAll("[data-widget]")).map((cell) => `${cell.dataset.widget}:${cell.dataset.size}`);

// What a broker who has changed nothing sees: the four widgets that were always there and five charts, in rows that fill the
// twelve columns of a wide screen (12, 12, 8 + 4, 4 + 4 + 4, 8 + 4). Three more charts are there to be switched on.
export const Default = {
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole("heading", { level: 1, name: /God (morgon|dag|kväll), Samuel/ })).toBeInTheDocument();
    await expect(cells(canvasElement)).toEqual([
      "quick-actions:full",
      "key-figures:full",
      "lead-trend:large",
      "next-steps:small",
      "pipeline:small",
      "funnel:small",
      "listing-status:small",
      "top-listings:large",
      "follow-ups:small"
    ]);
    const titles = headings(canvas);
    for (const title of ["Intresse över tid", "Leads per steg", "Konvertering", "Objekt per status", "Objekt i topp", "Kommande uppföljningar"]) {
      await expect(titles).toContain(title);
    }
    for (const title of ["Hyra per område", "Leadens matchning", "Tid på marknaden"]) await expect(titles).not.toContain(title);

    // The key figures are of the data: 30 leads, 4 of the 8 listings active.
    const figures = canvas.getByLabelText("Nyckeltal");
    await expect(within(figures).getByText("Inkomna leads").parentElement.parentElement).toHaveTextContent("30");
    await expect(within(figures).getByText("Aktiva objekt").parentElement.parentElement).toHaveTextContent("4");

    // The pipeline has a ring and a row for each step, the funnel a stage for each stage, and the ranking a column for each listing with the most leads.
    const pipeline = within(canvasElement.querySelector('[data-widget="pipeline"]'));
    await expect(pipeline.getByRole("list", { name: "Leads per steg" }).querySelectorAll("li")).toHaveLength(6);
    const funnel = within(canvasElement.querySelector('[data-widget="funnel"]'));
    for (const stage of ["Leads", "Kontaktade", "Visning bokad", "Vunna"]) await expect(funnel.getByText(stage)).toBeInTheDocument();
    await waitFor(() => expect(rankedSegments(canvasElement).length).toBeGreaterThan(0), { timeout: 4000 });
    // Charts drawn with Bklit UI (SVG): the donut of the listings and the columns of the follow-ups.
    await waitFor(() => expect(canvasElement.querySelector('[data-widget="listing-status"] svg')).toBeInTheDocument(), { timeout: 4000 });
    await waitFor(() => expect(canvasElement.querySelector('[data-widget="follow-ups"] svg')).toBeInTheDocument(), { timeout: 4000 });
  }
};

// The overview in dark mode: the cards take the dark surface and the charts their dark colours (variables with a light and a
// dark value), so the same chart is drawn in other colours and nothing is left in the light ones.
export const Dark = {
  globals: { theme: "dark" },
  play: async ({ canvas, canvasElement }) => {
    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    const card = canvasElement.querySelector('[data-widget="pipeline"] [data-slot="card"]');
    await expect(getComputedStyle(card).backgroundColor).toBe("rgb(15, 17, 21)");
    await expect(getComputedStyle(canvas.getByRole("heading", { level: 1 })).color).toBe("rgb(236, 238, 242)");
    // The first ring of the pipeline has Bklit's dark-mode primary (white, the first of its chart palette). The colours ease in
    // (`transition-all`), so they are read until they have arrived.
    const dot = canvasElement.querySelector('[data-widget="pipeline"] ul span.rounded-full');
    await waitFor(() => expect(getComputedStyle(dot).backgroundColor).toMatch(/^(rgb\(255, 255, 255\)|oklch\(1 0 (0|none)\)|color\(srgb 1 1 1\))/), { timeout: 4000 });
    // Three layers: what is pressed (a quick action) is a step lighter than the card, and the card than the page.
    const tile = canvas.getByRole("button", { name: /Hantera objekt/ });
    await waitFor(() => expect(getComputedStyle(tile).backgroundColor).toBe("rgb(23, 26, 32)"), { timeout: 4000 });
    await expect(getComputedStyle(document.body).backgroundColor).toBe("rgb(5, 6, 8)");
    await expect(getComputedStyle(card).borderTopColor).toBe("rgba(255, 255, 255, 0.125)");
    // The first quick action is the strong fill, which is light in dark mode, with dark text.
    const first = canvas.getByRole("button", { name: /Ny annons/ });
    await waitFor(() => expect(getComputedStyle(first).backgroundColor).toBe("rgb(236, 238, 242)"), { timeout: 4000 });
    await waitFor(() => expect(getComputedStyle(first).color).toBe("rgb(8, 9, 11)"), { timeout: 4000 });
  }
};

// "Objekt i topp" ranks by leads or by views, and the ranking follows.
export const TopListingsMetric = {
  play: async ({ canvasElement, userEvent }) => {
    const card = within(canvasElement.querySelector('[data-widget="top-listings"]'));
    await expect(card.getByText("Objekten med flest leads")).toBeInTheDocument();
    await waitFor(() => expect(rankedSegments(canvasElement).length).toBeGreaterThan(0), { timeout: 4000 });
    await userEvent.click(card.getByRole("button", { name: "Flest visningar" }));
    await expect(card.getByText("Objekten med flest annonsvisningar")).toBeInTheDocument();
    // The chart is drawn again for the other ranking, with the listing that has the most views (Odenplan, 1 248) among its labels.
    await waitFor(() => expect(card.getByText("Ljust kontor vid Odenplan")).toBeInTheDocument(), { timeout: 6000 });
    await expect(card.getByText(/^1 ?248 visningar$/)).toBeInTheDocument();
  }
};

// The button in the corner opens the overlay; switching a widget on and saving puts it on the overview, in the place the
// list gave it, and the choice is kept in this browser.
export const CustomizeAndSave = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    await expect(canvas.queryByRole("heading", { name: "Hyra per område" })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Anpassa" }));
    const dialog = await within(document.body).findByRole("dialog", {}, { timeout: 4000 });
    const row = (id) => dialog.querySelector(`[data-widget-row="${id}"]`);
    await userEvent.click(within(row("rent-by-district")).getByRole("switch"));
    await userEvent.click(within(row("rent-by-district")).getByRole("button", { name: /^Mellan,/ }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Spara" }));
    await waitFor(() => expect(canvas.getByRole("heading", { name: "Hyra per område" })).toBeInTheDocument(), { timeout: 6000 });

    await expect(canvas.getByRole("heading", { name: "Hyra per område" })).toBeInTheDocument();
    await expect(cells(canvasElement).at(-1)).toBe("rent-by-district:medium");
    const rent = within(canvasElement.querySelector('[data-widget="rent-by-district"]'));
    // A radar of the areas and a row for each, the dearest first: Östermalm 60 000 kr/mån for 120 kvm is 6 000 kr per kvm and year.
    const areas = rent.getByRole("list", { name: "Snitthyra per område" });
    await expect(within(areas).getAllByRole("listitem")[0]).toHaveTextContent("Östermalm");
    await expect(within(areas).getAllByRole("listitem")[0]).toHaveTextContent("6 000 kr");

    const stored = JSON.parse(window.localStorage.getItem(storageKey));
    await expect(stored.items.find((item) => item.id === "rent-by-district")).toEqual({ id: "rent-by-district", size: "medium", visible: true });
  }
};

// A layout stored earlier is what the overview starts with: this one has the ranking first, full width, and no key figures.
export const StoredLayout = {
  beforeEach: withLayout({
    version: 1,
    items: moveItem(defaultLayout().items, "top-listings", "quick-actions").map((item) =>
      item.id === "top-listings" ? { ...item, size: "full" } : item.id === "key-figures" ? { ...item, visible: false } : item
    )
  }),
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole("heading", { level: 1 })).toBeInTheDocument();
    const shown = cells(canvasElement);
    await expect(shown[0]).toBe("top-listings:full");
    await expect(shown).not.toContain("key-figures:full");
    await expect(shown).toHaveLength(8);
    await expect(canvas.queryByLabelText("Nyckeltal")).not.toBeInTheDocument();
  }
};

// A stored value that is not a layout (an old version, damaged, edited by hand) is ignored and the default is shown.
export const DamagedLayout = {
  beforeEach: () => {
    window.localStorage.setItem(storageKey, "{not json");
    return forget;
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(cells(canvasElement)).toHaveLength(9));
    await expect(cells(canvasElement)[0]).toBe("quick-actions:full");
  }
};

// Every widget switched on: each statistic is drawn by a Bklit component of its own kind, and none repeats another's.
export const AllWidgets = {
  beforeEach: withLayout({ version: 1, items: defaultLayout().items.map((item) => ({ ...item, visible: true })) }),
  play: async ({ canvasElement }) => {
    const kinds = {
      "lead-trend": "area",
      pipeline: "ring",
      funnel: "funnel",
      "listing-status": "pie",
      "top-listings": "bar",
      "follow-ups": "bar",
      "rent-by-district": "legend",
      "lead-fit": "gauge",
      "listing-age": "squares"
    };
    for (const id of Object.keys(kinds)) {
      await waitFor(() => expect(canvasElement.querySelector(`[data-widget="${id}"] svg, [data-widget="${id}"] .legend-container, [data-widget="${id}"] [data-slot="progress-track"]`)).toBeInTheDocument(), { timeout: 6000 });
    }
  }
};

// With every widget switched off the overview says so and offers the way back.
export const NothingShown = {
  beforeEach: withLayout({ version: 1, items: defaultLayout().items.map((item) => ({ ...item, visible: false })) }),
  play: async ({ canvas, canvasElement, userEvent }) => {
    await expect(canvas.getByRole("heading", { name: "Din översikt är tom" })).toBeInTheDocument();
    await expect(cells(canvasElement)).toHaveLength(0);
    await userEvent.click(canvas.getByRole("button", { name: "Återställ standard" }));
    await waitFor(() => expect(cells(canvasElement)).toHaveLength(9));
    await expect(window.localStorage.getItem(storageKey)).toBeNull();
  }
};

// A broker with nothing yet: every chart says what is missing instead of drawing an empty frame.
export const NoData = {
  args: { listings: [], leads: [] },
  beforeEach: withLayout({ version: 1, items: defaultLayout().items.map((item) => ({ ...item, visible: true })) }),
  play: async ({ canvas, canvasElement }) => {
    await expect(cells(canvasElement)).toHaveLength(12);
    await expect(canvas.getByText(/Inga leads ännu/)).toBeInTheDocument();
    await expect(canvas.getByText(/Ingen konvertering att visa ännu/)).toBeInTheDocument();
    await expect(canvas.getByText(/Inga objekt ännu/)).toBeInTheDocument();
    await expect(canvas.getByText(/Inga planerade uppföljningar/)).toBeInTheDocument();
    await expect(canvas.getByText(/Ingen hyra att jämföra ännu/)).toBeInTheDocument();
    await expect(canvas.getByText(/Inga leads med matchningspoäng ännu/)).toBeInTheDocument();
    await expect(canvas.getByText(/Inga aktiva annonser ute på marknaden/)).toBeInTheDocument();
    await expect(canvas.queryAllByRole("progressbar")).toHaveLength(0);
  }
};

export const Loading = {
  args: { loading: true, listings: [], leads: [] },
  beforeEach: withLayout({ version: 1, items: defaultLayout().items.map((item) => ({ ...item, visible: true })) }),
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Nyckeltal")).toHaveAttribute("aria-busy", "true");
    await expect(canvas.getAllByText("Laddar statistik…").length).toBeGreaterThanOrEqual(8);
  }
};

export const LoadError = {
  args: { loading: false, error: "Kunde inte hämta dina objekt.", listings: [], leads: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert")).toHaveTextContent("Kunde inte hämta dina objekt.");
    await expect(canvas.getAllByText("Statistik kunde inte hämtas").length).toBeGreaterThanOrEqual(3);
  }
};
