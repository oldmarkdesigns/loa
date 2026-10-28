import LocalProgramModule from "../../components/app/LocalProgramModule";
import PanelProfileSection from "./PanelProfileSection";
import MessagesPage from "./MessagesPage";
import PublishPage from "./PublishPage";
import AppShell from "../../components/layout/AppShell";
import { useState } from "react";
import { fn, expect, fireEvent, within, waitFor } from "storybook/test";
import AdminPanelPage from "./AdminPanelPage";
import BrokerPanelPage, { LeadDetailPanel } from "./BrokerPanelPage";
import ListingEditorOverlay from "../../components/app/ListingEditorOverlay";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { leadActivitiesApi, listingApi, prospectsApi, prospectCommentsApi } from "../../api";
import { queueImportFiles, sampleImportFiles } from "../../lib/listingImport";

const listings = [
  {
    id: "office-1",
    title: "Ljust kontor vid Odenplan",
    address: "Odengatan 62",
    district: "Vasastan",
    type: "Kontor",
    sizeSqm: 240,
    priceMonthly: 48000,
    views: 1248,
    inquiries: 18,
    ownerId: "owner-1",
    companyId: "company-1",
    status: "active",
    advertiserName: "Anna Svensson",
    image: "/object-images/object-1.jpeg",
    amenities: ["Fiber"],
    description: "Ett ljust kontor med öppna ytor och plats för hela teamet.",
    updatedAt: "2026-09-18T10:00:00Z"
  },
  {
    id: "office-2",
    title: "Studio i Hornstull",
    address: "Hornsgatan 96",
    district: "Södermalm",
    type: "Studio",
    sizeSqm: 85,
    priceMonthly: 18500,
    views: 386,
    inquiries: 6,
    ownerId: "owner-1",
    companyId: "company-1",
    status: "draft",
    advertiserName: "Anna Svensson",
    image: "/object-images/object-2.jpeg",
    amenities: [],
    updatedAt: "2026-09-17T10:00:00Z"
  },
  {
    id: "office-3",
    title: "Flexibelt kontor vid vattnet",
    address: "Kungsholms strand 15",
    district: "Kungsholmen",
    type: "Kontor",
    sizeSqm: 160,
    priceMonthly: 32000,
    views: 672,
    inquiries: 9,
    ownerId: "owner-1",
    companyId: "company-1",
    status: "active",
    advertiserName: "Anna Svensson",
    image: "/object-images/object-3.jpeg",
    amenities: [],
    updatedAt: "2026-09-16T10:00:00Z"
  }
];
const app = {
  user: { id: "owner-1", name: "Anna Svensson", profile: { companyName: "Strand Fastigheter", companyId: "company-1" } },
  adminCompany: { id: "company-1", name: "Strand Fastigheter" },
  listings,
  leads: [],
  companyBrokers: [],
  notifications: [],
  favorites: [],
  searchHistory: [],
  logout: fn(),
  updateListing: fn(async () => {}),
  deleteListing: fn(async () => {}),
  publishListing: fn(async () => {}),
  pushToast: fn()
};
const prospect = {
  id: "prospect-1",
  listingId: "office-1",
  title: "Odenplan – presentation",
  status: "draft",
  currentVersion: 0,
  updatedAt: new Date().toISOString(),
  draftSections: [
    { id: "description", kind: "description", title: "Lokalbeskrivning", body: "Ett kontor för nästa kapitel.", order: 1, attachments: [] }
  ],
  publishedSections: [],
  listingSummary: listings[0]
};

export default {
  title: "Admin/Redesigned panels",
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="h-screen">
          <Story />
        </div>
      </TooltipProvider>
    )
  ]
};
export const Overview = {
  render: () => <AdminPanelPage app={app} pathname="/app/admin" />,
  play: async ({ canvasElement }) => {
    // Light is what it always was: white cards with a hairline of black at 10 %. (The toolbar can turn any story dark, where the same
    // class is a hairline of white at 12.5 %: the dark gain.)
    const dark = document.documentElement.classList.contains("dark");
    const card = await waitFor(() => {
      const found = canvasElement.querySelector('[data-slot="card"]');
      expect(found).not.toBeNull();
      return found;
    });
    await expect(getComputedStyle(card).backgroundColor).toBe(dark ? "rgb(15, 17, 21)" : "rgb(255, 255, 255)");
    await expect(getComputedStyle(card).borderTopColor).toBe(dark ? "rgba(255, 255, 255, 0.125)" : "rgba(0, 0, 0, 0.1)");
  }
};
export const Statistics = { render: () => <AdminPanelPage app={app} pathname="/app/admin/statistik" /> };

// The workspace in dark mode (the toolbar's "Tema" turns every story dark; this one is dark by itself). The page, the cards, the
// text and the charts take their colours from the theme, so what is checked here is the values of the tokens.
export const OverviewDark = {
  globals: { theme: "dark" },
  render: () => <AdminPanelPage app={app} pathname="/app/admin" />,
  play: async ({ canvas, canvasElement }) => {
    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    await expect(getComputedStyle(document.body).backgroundColor).toBe("rgb(5, 6, 8)");
    const card = await waitFor(() => {
      const found = canvasElement.querySelector('[data-slot="card"]');
      expect(found).not.toBeNull();
      return found;
    });
    // Cards are the dark surface, a step above the page, with a hairline of white at 12.5 % (the 10 % of the class, times the dark gain
    // of 1.25), and their text is light.
    await expect(getComputedStyle(card).backgroundColor).toBe("rgb(15, 17, 21)");
    await expect(getComputedStyle(card).borderTopColor).toBe("rgba(255, 255, 255, 0.125)");
    await expect(getComputedStyle(within(card).getAllByText(/\S/)[0]).color).not.toBe("rgb(11, 10, 14)");
    // The side menu's active row is the strong fill (light in dark mode) with the text of a strong fill (dark).
    const active = canvasElement.querySelector('.admin-nav-row[data-active="true"]');
    await expect(getComputedStyle(active).color).toBe("rgb(8, 9, 11)");
    await expect(getComputedStyle(canvasElement.querySelector(".admin-nav-indicator")).backgroundColor).toBe("rgb(236, 238, 242)");
  }
};
export const Listings = {
  render: () => <AdminPanelPage app={app} pathname="/app/admin/annonser" />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole("textbox", { name: "Sök annonser" }), "Hornstull");
    await expect(canvas.getByRole("button", { name: "Studio i Hornstull" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Ljust kontor vid Odenplan" })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Studio i Hornstull" }));
    await waitFor(() => expect(within(document.body).getByRole("dialog")).toBeVisible());
  }
};
export const EmptyListings = { render: () => <AdminPanelPage app={{ ...app, listings: [] }} pathname="/app/admin/annonser" /> };
function withProspectApi() {
  const original = [
    listingApi.getListings,
    prospectsApi.listMine,
    prospectsApi.getProspect,
    prospectCommentsApi.listComments,
    prospectsApi.saveDraft
  ];
  let saved = structuredClone(prospect);
  listingApi.getListings = async () => ({ listings });
  prospectsApi.listMine = async () => ({ prospects: [saved] });
  prospectsApi.getProspect = async () => ({ prospect: saved });
  prospectCommentsApi.listComments = async () => ({ comments: [] });
  prospectsApi.saveDraft = fn(async (id, title, sections) => {
    saved = { ...saved, title, draftSections: sections, updatedAt: new Date(Date.parse(saved.updatedAt) + 1).toISOString() };
    return { prospect: saved };
  });
  return () => {
    [listingApi.getListings, prospectsApi.listMine, prospectsApi.getProspect, prospectCommentsApi.listComments, prospectsApi.saveDraft] = original;
  };
}

// The three-dot menu at the end of a row: opens it and picks an action.
// Answers a field in one change. userEvent.type only reaches React's onChange while the preview frame has focus, which the
// browser pane does not always give it, so the question flows enter values like this and keep userEvent for clicks and Enter.
const fill = (field, value) => fireEvent.change(field, { target: { value } });

async function chooseRowAction(canvas, userEvent, rowName, action) {
  // A menu that was just used is still fading out, and its items no longer take clicks.
  await waitFor(() => expect(within(document.body).queryAllByRole("menu")).toHaveLength(0), { timeout: 4000 });
  await userEvent.click(await canvas.findByRole("button", { name: `Åtgärder för ${rowName}` }));
  await userEvent.click(await within(document.body).findByRole("menuitem", { name: action }, { timeout: 4000 }));
}

export const BrokerProspects = {
  beforeEach: withProspectApi,
  render: () => <BrokerPanelPage app={app} pathname="/app/broker/prospekt" />,
  play: async ({ canvas, userEvent }) => {
    await chooseRowAction(canvas, userEvent, "Odenplan – presentation", "Redigera");
    const body = within(document.body);
    const title = await body.findByDisplayValue("Odenplan – presentation");
    // The sections are entries of the sidebar; the description is one of them.
    await userEvent.click(await body.findByRole("button", { name: /Beskrivning/ }));
    await body.findByDisplayValue("Ett kontor för nästa kapitel.", {}, { timeout: 4000 });
    await userEvent.clear(title);
    await userEvent.type(title, "Uppdaterat prospekt");
    // Closing an edited prospect asks first; the prompt can save the draft, and the editor stays open with the new title.
    await userEvent.click(body.getByRole("button", { name: "Stäng", exact: true }));
    const prompt = within(await body.findByRole("alertdialog", {}, { timeout: 4000 }));
    await userEvent.click(prompt.getByRole("button", { name: "Spara utkast" }));
    await waitFor(() => expect(prospectsApi.saveDraft).toHaveBeenCalledWith("prospect-1", "Uppdaterat prospekt", expect.any(Array)), { timeout: 4000 });
    await expect(await body.findByDisplayValue("Uppdaterat prospekt")).toBeInTheDocument();
  }
};

// The assistant beside the prospect: review, several sections filled in one go, saved as a draft.
export const ProspectEditorAssistant = {
  beforeEach: withProspectApi,
  render: () => <BrokerPanelPage app={app} pathname="/app/broker/prospekt" />,
  play: async ({ canvas, userEvent }) => {
    const body = within(document.body);
    await chooseRowAction(canvas, userEvent, "Odenplan – presentation", "Redigera");
    await body.findByText(/Jag har gått igenom prospektet: 5 saker kan bli bättre/, {}, { timeout: 5000 });
    // Beside the form from the lg breakpoint; below it, behind the "Assistent" button.
    const toggle = body.queryByRole("button", { name: "Assistent" });
    if (toggle) await userEvent.click(toggle);

    await userEvent.click(await body.findByRole("button", { name: "Förbättra allt" }));
    await body.findByText("Uppsägningstid: 3 månader", {}, { timeout: 4000 });
    await expect(prospectsApi.saveDraft).not.toHaveBeenCalled();
    await userEvent.click(body.getByRole("button", { name: "Använd och spara" }));
    await waitFor(() => expect(prospectsApi.saveDraft).toHaveBeenCalledWith("prospect-1", "Odenplan – presentation", expect.arrayContaining([
      expect.objectContaining({ kind: "terms", body: expect.stringContaining("Uppsägningstid: 3 månader") })
    ])), { timeout: 4000 });
    await body.findByText(/Klart – utkastet är sparat/, {}, { timeout: 4000 });
  }
};

function EditorHarness({ failing = false }) {
  const [open, setOpen] = useState(true);
  return open ? (
    <ListingEditorOverlay
      listing={listings[0]}
      app={{
        ...app,
        updateListing: failing
          ? async () => {
              throw new Error("Kunde inte spara");
            }
          : app.updateListing
      }}
      onClose={() => setOpen(false)}
    />
  ) : (
    <Button onClick={() => setOpen(true)}>Öppna redigering</Button>
  );
}
export const ObjectEditor = {
  render: () => <EditorHarness />,
  play: async ({ userEvent }) => {
    const body = within(document.body);
    const title = await body.findByDisplayValue("Ljust kontor vid Odenplan");
    await userEvent.clear(title);
    await userEvent.type(title, "Ny titel");
    await userEvent.click(body.getByRole("button", { name: "Stäng redigering" }));
    await body.findByRole("alertdialog", {}, { timeout: 4000 });
    await userEvent.click(body.getByRole("button", { name: "Fortsätt redigera" }));
    await userEvent.click(body.getByRole("tab", { name: "Bekvämligheter" }));
    await expect(body.getByRole("button", { name: /fiber/i })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(body.getByRole("button", { name: "Spara ändringar" }));
    await expect(app.updateListing).toHaveBeenCalledWith("office-1", expect.objectContaining({ title: "Ny titel" }));
    await userEvent.click(body.getByRole("button", { name: "Radera", exact: true }));
    await body.findByRole("alertdialog", {}, { timeout: 4000 });
    await expect(app.deleteListing).not.toHaveBeenCalled();
    await userEvent.click(body.getByRole("button", { name: "Avbryt" }));
  }
};
export const FailedSave = { render: () => <EditorHarness failing /> };

// Beside the form from the lg breakpoint; below it, behind the "Assistent" button in the header.
async function openEditorAssistant(body, userEvent) {
  const toggle = body.queryByRole("button", { name: "Assistent" });
  if (toggle) await userEvent.click(toggle);
}

// The assistant beside the form in "Redigera objekt": review, several edits at once, and finding the right field.
export const ObjectEditorAssistant = {
  render: () => <EditorHarness />,
  play: async ({ userEvent }) => {
    app.updateListing.mockClear();
    const body = within(document.body);
    await body.findByText(/Jag har gått igenom annonsen: 4 saker kan bli bättre/, {}, { timeout: 5000 });
    await openEditorAssistant(body, userEvent);

    // "Förbättra allt" proposes edits to several fields, each one a checkbox.
    await userEvent.click(body.getByRole("button", { name: "Förbättra allt" }));
    await body.findByText("Lägg till: Mötesrum, Kök och Reception", {}, { timeout: 4000 });
    await expect(app.updateListing).not.toHaveBeenCalled();

    // "Använd och spara" writes all of them in one save.
    await userEvent.click(body.getByRole("button", { name: "Använd och spara" }));
    await waitFor(() => expect(app.updateListing).toHaveBeenCalledWith("office-1", expect.objectContaining({
      amenities: expect.arrayContaining(["Fiber", "Mötesrum", "Kök", "Reception"]),
      description: expect.stringContaining("I lokalen och fastigheten finns")
    })), { timeout: 4000 });
    await body.findByText("Alla ändringar sparade", {}, { timeout: 4000 });

    // It carries on with what is left, and compares the rent when asked.
    await body.findByText(/Klart – sparat/, {}, { timeout: 4000 });
    await userEvent.click(body.getByRole("button", { name: "Jämför hyran" }));
    await body.findByText(/för få liknande objekt/, {}, { timeout: 4000 });
  }
};

export const ObjectEditorAssistantShowsFields = {
  render: () => <EditorHarness />,
  play: async ({ userEvent }) => {
    const body = within(document.body);
    await body.findByText(/Jag har gått igenom annonsen/, {}, { timeout: 5000 });
    await openEditorAssistant(body, userEvent);
    await userEvent.click(await body.findByRole("button", { name: "Visa bilder" }));
    await waitFor(() => expect(body.getByRole("tab", { name: "Bilder" })).toHaveAttribute("aria-selected", "true"), { timeout: 3000 });
    await body.findByText(/Jag har öppnat bilderna åt dig/, {}, { timeout: 4000 });
  }
};

export const BrokerListings = {
  beforeEach: () => {
    const original = listingApi.getListings;
    listingApi.getListings = async () => ({ listings });
    return () => {
      listingApi.getListings = original;
    };
  },
  render: () => <BrokerPanelPage app={app} pathname="/app/broker/objekt" />
};
export const CompanyProspects = {
  beforeEach: () => {
    const original = prospectsApi.listForCompany;
    prospectsApi.listForCompany = async () => ({ prospects: [prospect] });
    return () => {
      prospectsApi.listForCompany = original;
    };
  },
  render: () => <AdminPanelPage app={app} pathname="/app/admin/prospekt" />
};

export const BrokerOverviewFullApp = {
  beforeEach: () => {
    const original = listingApi.getListings;
    listingApi.getListings = async () => ({ listings });
    return () => {
      listingApi.getListings = original;
    };
  },
  render: () => {
    const previewApp = {
      ...app,
      user: { ...app.user, name: "Samuel Oldmark", role: "broker", activeRole: "broker", roles: ["broker"] },
      leads: Array.from({ length: 24 }, (_, index) => ({
        id: `lead-${index}`,
        listingId: listings[index % 3].id,
        status: ["new", "contacted", "viewing_booked", "negotiating"][index % 4],
        createdAt: new Date(Date.now() - (index % 21) * 86400000).toISOString()
      }))
    };
    return (
      <AppShell pathname="/app/broker" user={previewApp.user} listings={listings} onLogout={app.logout}>
        <BrokerPanelPage app={previewApp} pathname="/app/broker" />
      </AppShell>
    );
  },
  play: async ({ canvas, userEvent }) => {
    await waitFor(() => expect(canvas.getByRole("heading", { name: /God (morgon|dag|kväll), Samuel/ })).toBeVisible());
    await expect(canvas.getByRole("heading", { name: "Intresse över tid" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Senaste 7 dagarna" }));
    await expect(canvas.getByRole("button", { name: "Senaste 7 dagarna" })).toHaveAttribute("aria-pressed", "true");
  }
};
// The panels have no top bar: the company switcher and the mode switch head the side menu.
const workspaceSwitchRole = fn(async () => null);
export const WorkspaceChrome = {
  beforeEach: () => {
    const original = listingApi.getListings;
    listingApi.getListings = async () => ({ listings });
    return () => {
      listingApi.getListings = original;
    };
  },
  render: () => {
    const previewApp = { ...app, user: { ...app.user, name: "Samuel Oldmark", email: "samuel@strandfastigheter.se", role: "broker", activeRole: "broker", roles: ["broker"] } };
    return (
      <AppShell pathname="/app/broker" user={previewApp.user} listings={listings} onSwitchRole={workspaceSwitchRole} onLogout={app.logout}>
        <BrokerPanelPage app={previewApp} pathname="/app/broker" />
      </AppShell>
    );
  },
  play: async ({ canvas, userEvent }) => {
    workspaceSwitchRole.mockClear();
    const heading = await canvas.findByRole("heading", { name: /God (morgon|dag|kväll), Samuel/ }, { timeout: 5000 });

    // The date and the clock sit in the greeting's row, and nothing floats at the top right of the page: publishing has
    // its own buttons in the panel, and the profile links, help and logging out are in the side menu.
    const greeting = heading.closest("header");
    await expect(within(greeting).getByText(/dag \d{1,2} \p{L}+/u)).toBeInTheDocument();
    await expect(within(greeting).getByText(/^\d{2}:\d{2}:\d{2}$/)).toBeInTheDocument();
    for (const name of ["Publicera annons", "Notiser", "Profilmeny"]) {
      await expect(canvas.queryByRole("button", { name, hidden: true })).toBeNull();
    }

    // The company selector and the fold button share the header of the side menu, the search follows, then the pages under
    // their titles, and at the foot the way over to searching for space above the person (the menu is hidden below lg, so the
    // DOM order is checked). The rest of the menu is in PanelSidebar.stories.
    const menu = within(document.querySelector("aside.admin-sidebar-panel"));
    const company = menu.getByText("Strand Fastigheter");
    const collapse = menu.getByRole("button", { name: "Fäll ihop meny", hidden: true });
    const search = menu.getByRole("button", { name: "Sök", hidden: true });
    const pages = menu.getByRole("navigation", { name: "Arbetsyta", hidden: true });
    const modeSwitch = menu.getByRole("button", { name: "Växla till sökläge", hidden: true });
    const person = menu.getByRole("button", { name: /Samuel Oldmark/, hidden: true });
    const follows = (first, second) => Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
    await expect(follows(company, collapse)).toBe(true);
    await expect(follows(collapse, search)).toBe(true);
    // The pages are in groups, each under a title of its own, inside the pages' navigation: the first is Arbetsyta, over Översikt.
    const firstTitle = within(pages).getByText("Arbetsyta");
    await expect(follows(search, pages)).toBe(true);
    await expect(pages.contains(firstTitle)).toBe(true);
    await expect(follows(firstTitle, within(pages).getByRole("button", { name: "Översikt", hidden: true }))).toBe(true);
    await expect(follows(pages, modeSwitch)).toBe(true);
    await expect(follows(modeSwitch, person)).toBe(true);
    await expect(person).toHaveTextContent("samuel@strandfastigheter.se");

    // It leaves for the search pages, and the role follows.
    const start = window.location.pathname + window.location.search;
    await userEvent.click(modeSwitch);
    await expect(workspaceSwitchRole).toHaveBeenCalledWith("broker");
    await expect(window.location.pathname).toBe("/app/rent");
    window.history.replaceState(null, "", start);
  }
};
export const BrokerOverviewSparse = {
  beforeEach: () => {
    const original = listingApi.getListings;
    listingApi.getListings = async () => ({ listings: [{ ...listings[1], views: 0, responseHours: 2 }] });
    return () => {
      listingApi.getListings = original;
    };
  },
  render: () => {
    const previewApp = {
      ...app,
      user: { ...app.user, name: "Samuel Oldmark", role: "broker", activeRole: "broker", roles: ["broker"] },
      leads: [
        { id: "lead-1", listingId: listings[1].id, status: "new" },
        { id: "lead-2", listingId: listings[1].id, status: "contacted" }
      ]
    };
    return (
      <AppShell pathname="/app/broker" user={previewApp.user} listings={listings} onLogout={app.logout}>
        <BrokerPanelPage app={previewApp} pathname="/app/broker" />
      </AppShell>
    );
  }
};

const publishApp = {
  ...app,
  user: { ...app.user, role: "broker" },
  createListing: fn(async (payload) => ({ listing: { id: "listing-new", ...payload } })),
  updateListing: fn(async (id, payload) => ({ listing: { id, ...payload } })),
  publishListing: fn(async (id) => ({ listing: { id, status: "active" } }))
};

function PublishOverlayPreview() {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-semibold">Dina objekt</h1>
      <Button onClick={() => setOpen(true)}>Publicera annons</Button>
      {open ? <PublishPage app={publishApp} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}

export const PublishOverlay = {
  render: () => <PublishOverlayPreview />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Publicera annons" }));
    const body = within(document.body);
    await waitFor(() => expect(body.getByRole("dialog", { name: "Publicera annons" })).toBeVisible());
    await userEvent.click(body.getByRole("button", { name: "Stäng publicering" }));
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(canvas.getByRole("heading", { name: "Dina objekt" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Publicera annons" }));
  }
};

export const PublishAnswerBeat = {
  render: () => <PublishOverlayPreview />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Publicera annons" }));
    const body = within(document.body);
    const orb = () => document.querySelector("[data-orb-state]");
    // Assertions avoid toBeVisible(): the step content fades in, and opacity 0 reads as hidden.
    await body.findByRole("heading", { name: "Hur vill du skapa annonsen?" }, { timeout: 4000 });
    await userEvent.click(body.getByRole("button", { name: /Skapa manuellt/ }));
    await body.findByRole("heading", { name: "Vad ska annonsen heta?" }, { timeout: 4000 });
    await waitFor(() => expect(orb().dataset.orbState).toBe("breathing"), { timeout: 3000 });

    // An empty answer is refused inline and the orb stays calm.
    await userEvent.click(body.getByRole("button", { name: "Nästa" }));
    await body.findByText("Fyll i obligatoriska fält: Rubrik.");
    await expect(orb().dataset.orbState).toBe("breathing");

    // A real answer is acknowledged at once, worked on with a state that fits the step, then the next question arrives.
    const seen = [];
    const observer = new MutationObserver(() => seen.push(orb().dataset.orbState));
    observer.observe(orb(), { attributes: true, attributeFilter: ["data-orb-state"] });
    fill(body.getByRole("textbox", { name: /Rubrik/ }), "Kontor");
    await userEvent.type(body.getByRole("textbox", { name: /Rubrik/ }), "{Enter}");
    await body.findByRole("heading", { name: "Var ligger lokalen?" }, { timeout: 4000 });
    await waitFor(() => expect(orb().dataset.orbState).toBe("breathing"));
    observer.disconnect();
    await expect(seen).toEqual(["listening", "composing", "breathing"]);
    await expect(body.getByText("Fråga 2 av 11")).toBeInTheDocument();

    await userEvent.click(body.getByRole("button", { name: "Föregående" }));
    await body.findByDisplayValue("Kontor", {}, { timeout: 4000 });
  }
};

export const PublishFlowToPublished = {
  render: () => <PublishOverlayPreview />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Publicera annons" }));
    const dialog = within(await within(document.body).findByRole("dialog", { name: "Publicera annons" }, { timeout: 4000 }));
    const question = (name) => dialog.findByRole("heading", { name }, { timeout: 5000 });
    const next = () => userEvent.click(dialog.getByRole("button", { name: "Nästa" }));

    await question("Hur vill du skapa annonsen?");
    await userEvent.click(dialog.getByRole("button", { name: /Skapa manuellt/ }));
    await question("Vad ska annonsen heta?");
    fill(dialog.getByRole("textbox", { name: /Rubrik/ }), "Kontor");
    await userEvent.type(dialog.getByRole("textbox", { name: /Rubrik/ }), "{Enter}");
    await question("Var ligger lokalen?");
    fill(dialog.getByRole("textbox", { name: /Adress/ }), "Gatan 1");
    await userEvent.type(dialog.getByRole("textbox", { name: /Adress/ }), "{Enter}");
    await question("Hur stor är lokalen och hur många passar den för?");
    fill(dialog.getByRole("spinbutton", { name: /Storlek/ }), "240");
    fill(dialog.getByRole("spinbutton", { name: /Team/ }), "20");
    await userEvent.type(dialog.getByRole("spinbutton", { name: /Team/ }), "{Enter}");
    await question("Vad kostar lokalen och hur ser avtalet ut?");
    fill(dialog.getByRole("spinbutton", { name: /Månadshyra/ }), "48000");
    await userEvent.type(dialog.getByRole("spinbutton", { name: /Månadshyra/ }), "{Enter}");
    await question("När kan en hyresgäst flytta in?");
    await next();
    await question("Vad behöver hyresgästen veta om vardagen i lokalen?");
    await next();
    await question("Vilka viktiga villkor ska synas?");
    await next();
    await question("Vilka bilder ska sälja in lokalen?");
    await next();
    await question("Vad ingår eller utmärker lokalen?");
    await next();
    await question("Hur skulle du beskriva lokalen för rätt hyresgäst?");
    fill(dialog.getByRole("textbox", { name: /Beskrivning/ }), "Ljust kontor.");
    await next();
    await question("Ser allt rätt ut?");
    await userEvent.click(dialog.getByRole("button", { name: "Publicera annons" }));
    await dialog.findByRole("heading", { name: "Annonsen är publicerad" }, { timeout: 4000 });
    await expect(publishApp.publishListing).toHaveBeenCalled();
  }
};

export const PublishImportFlow = {
  render: () => <PublishOverlayPreview />,
  play: async ({ canvas, userEvent }) => {
    publishApp.publishListing.mockClear();
    await userEvent.click(canvas.getByRole("button", { name: "Publicera annons" }));
    const dialog = within(await within(document.body).findByRole("dialog", { name: "Publicera annons" }, { timeout: 4000 }));
    await dialog.findByRole("heading", { name: "Hur vill du skapa annonsen?" }, { timeout: 4000 });
    await userEvent.click(dialog.getByRole("button", { name: /Ladda upp dokument/ }));
    await dialog.findByRole("heading", { name: "Vilka dokument vill du läsa in?" }, { timeout: 4000 });
    await userEvent.click(dialog.getByRole("button", { name: "Prova med exempelfiler" }));
    await userEvent.click(dialog.getByRole("button", { name: "Läs in 2 filer" }));

    // The documents are read (mocked), then every listing found is offered for review.
    await dialog.findByRole("heading", { name: "Vi hittade 4 objekt" }, { timeout: 12000 });
    // One listing has no address or team size, so publishing everything is blocked until it is fixed.
    await expect(dialog.getByRole("button", { name: "Publicera 4 annonser" })).toBeDisabled();

    // "Granska" opens the same editor as "Redigera objekt": categories, every field, and the assistant.
    const row = dialog.getByText("Butikslokal på Götgatan").closest("li");
    await userEvent.click(within(row).getByRole("button", { name: "Granska" }));
    const editor = within(await within(document.body).findByRole("dialog", { name: "Granska importerat objekt" }, { timeout: 4000 }));
    await editor.findByText(/Saknas: Adress, Team \/ platser/, {}, { timeout: 4000 });
    await expect(editor.getByRole("tab", { name: "Läge & vardag" })).toBeInTheDocument();
    fill(document.querySelector('[data-field="address"]'), "Götgatan 12");
    fill(document.querySelector('[data-field="capacity"]'), "6");
    await editor.findByText("Alla obligatoriska uppgifter är ifyllda", {}, { timeout: 4000 });
    await userEvent.click(editor.getByRole("button", { name: "Godkänn objekt" }));

    // Approved, so nothing blocks publishing all four.
    await waitFor(() => expect(dialog.getByRole("button", { name: "Publicera 4 annonser" })).toBeEnabled(), { timeout: 4000 });
    await userEvent.click(dialog.getByRole("button", { name: "Publicera 4 annonser" }));
    await dialog.findByRole("heading", { name: "4 annonser är publicerade" }, { timeout: 6000 });
    await expect(publishApp.publishListing).toHaveBeenCalledTimes(4);
  }
};

export const MessagesRedesigned = {
  render: () => <div className="h-[100dvh]"><MessagesPage app={{ ...app, user: { ...app.user, role: "broker" } }} /></div>
};

const daysAgo = (days) => new Date(Date.now() - days * 86400000).toISOString();

export const LeadWorkspace = {
  beforeEach: () => {
    const original = [leadActivitiesApi.getActivities, leadActivitiesApi.addActivity];
    let activities = [{ id: "activity-demo", type: "call", body: "Överenskommen detaljplansändring", createdAt: daysAgo(6) }];
    leadActivitiesApi.getActivities = async () => ({ activities });
    leadActivitiesApi.addActivity = fn(async (leadId, type, body) => {
      const activity = { id: `activity-${activities.length + 1}`, type, body, createdAt: new Date().toISOString() };
      activities = [activity, ...activities];
      return { activity };
    });
    return () => {
      [leadActivitiesApi.getActivities, leadActivitiesApi.addActivity] = original;
    };
  },
  render: () => (
    <LeadDetailPanel
      lead={{
        id: "demo-lead",
        status: "contacted",
        createdAt: daysAgo(9),
        renter: { name: "Samuel Oldmark", email: "samuel@example.com" },
        listing: listings[0],
        notes: "Skapad från visningsförfrågan"
      }}
      app={{ ...app, updateLead: fn(async () => {}) }}
      onClose={fn()}
    />
  ),
  play: async ({ userEvent }) => {
    const body = within(document.body);
    // The assistant opens with what matters for this lead: contacted six days ago, nothing since.
    await body.findByText(/Hej Anna! Du hörde av dig till Samuel för 6 dagar sedan/, {}, { timeout: 5000 });

    // "Jag ringde" → how did it go → a proposal that only saves once confirmed.
    await userEvent.click(body.getByRole("button", { name: "Jag ringde" }));
    await body.findByText("Bra! Hur gick samtalet med Samuel?", {}, { timeout: 4000 });
    await userEvent.click(body.getByRole("button", { name: "Positivt samtal" }));
    await body.findByText(/Bocka ur det du inte vill spara/, {}, { timeout: 4000 });
    await expect(leadActivitiesApi.addActivity).not.toHaveBeenCalled();
    await userEvent.click(body.getByRole("button", { name: "Bekräfta" }));

    // Confirmed: the call is logged, follow-up set, and the log on the right shows it.
    await body.findByText(/Klart – sparat/, {}, { timeout: 4000 });
    await expect(leadActivitiesApi.addActivity).toHaveBeenCalledWith("demo-lead", "call", "Pratade med Samuel – positivt och intresserad.");
    await body.findByText("Pratade med Samuel – positivt och intresserad.", {}, { timeout: 4000 });

    // The assistant carries on from what was just saved, offering the next actions.
    await body.findByText("Föreslagna nästa steg", {}, { timeout: 4000 });
  }
};

// The profile is pages of the account window now (Profil, Lokalprogram, Sparat): these look at a page on its own, without the window.
const profileApp = { ...app, favorites: [], filterPresets: [], user: { ...app.user, role: "broker" } };

export const ProfileRedesigned = {
  render: () => <div className="mx-auto max-w-[40rem] bg-popover p-6"><PanelProfileSection app={profileApp} page="profil" /></div>,
  play: async ({ canvas, userEvent }) => {
    // The details are rows; "Redigera" turns the ones that can be changed into fields, and Avbryt puts them back.
    await canvas.findByRole("heading", { name: "Personuppgifter" });
    await expect(canvas.queryByRole("textbox", { name: "Namn" })).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Redigera" }));
    await expect(await canvas.findByRole("textbox", { name: "Namn" })).toHaveValue("Anna Svensson");
    await expect(canvas.getByRole("textbox", { name: "E-post" })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: "Avbryt" }));
    await expect(canvas.queryByRole("textbox", { name: "Namn" })).toBeNull();
  }
};

// The approved verification is a row with its own small "Dölj", and it goes when it is hidden.
export const ProfileVerification = {
  render: () => (
    <div className="mx-auto max-w-[40rem] bg-popover p-6">
      <PanelProfileSection
        app={{
          ...app,
          favorites: [],
          filterPresets: [],
          notifications: [{ id: "n1", type: "broker_verification_approved", createdAt: "2026-07-14T12:02:00Z" }],
          user: { ...app.user, role: "broker", roles: ["broker"], profile: { ...app.user.profile, roleRequestStatus: "approved", companyName: "Oldmark Designs", organizationNumber: "990821-9471" } }
        }}
        page="profil"
      />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    await canvas.findByText("Verifiering godkänd", {}, { timeout: 4000 });
    await expect(canvas.getByText(/Du är verifierad som mäklare för Oldmark Designs \(990821-9471\)/)).toBeVisible();
    await expect(canvas.getAllByText("Verifierad mäklare").length).toBeGreaterThan(0);
    await userEvent.click(canvas.getByRole("button", { name: "Dölj verifieringskort" }));
    await expect(canvas.queryByText("Verifiering godkänd")).toBeNull();
  }
};

// The renters that match are rows on the Lokalprogram page, each starting at its logo, with the match in the corner.
export const ProfileRenterMatches = {
  render: () => <div className="mx-auto max-w-[40rem] bg-popover p-6"><PanelProfileSection app={profileApp} page="lokalprogram" /></div>,
  play: async ({ canvas }) => {
    const name = await canvas.findByText("Nordic Growth AB", {}, { timeout: 4000 });
    const row = name.closest("div.flex.items-start");
    await expect(within(row).getByText("Verifierad organisation")).toBeVisible();
    await expect(within(row).getByText("91%")).toBeVisible();
    await expect(canvas.getByText("BASIC Studio Group")).toBeVisible();
    await expect(canvas.getByText("Lind & Partners")).toBeVisible();
  }
};

// Saved listings and searches are the Sparat page of the account window: two cards.
const savedProfileApp = {
  ...app,
  user: { ...app.user, role: "broker" },
  favorites: [{ listingId: listings[0].id }, { listingId: listings[2].id }],
  filterPresets: [
    { id: "preset-1", title: "Kontor på Södermalm", updatedAt: new Date().toISOString(), filters: { district: "Södermalm", type: ["Kontor"], minSize: "100", maxSize: "200" } },
    { id: "preset-2", title: "Nära Hornstull", updatedAt: new Date().toISOString(), filters: { query: "Hornstull" } }
  ],
  toggleFavorite: fn(),
  deleteSavedFilter: fn()
};

export const ProfileSavedItems = {
  render: () => <div className="mx-auto max-w-[40rem] bg-popover p-6"><PanelProfileSection app={savedProfileApp} page="sparat" /></div>,
  play: async ({ userEvent }) => {
    const listingsCard = within(await waitFor(() => {
      const card = document.getElementById("sparade-objekt");
      if (!card) throw new Error("Kortet Sparade objekt saknas");
      return card;
    }, { timeout: 4000 }));
    await listingsCard.findByText("Ljust kontor vid Odenplan");
    await listingsCard.findByText("Flexibelt kontor vid vattnet");
    await expect(listingsCard.queryByText("Studio i Hornstull")).not.toBeInTheDocument();
    await listingsCard.findByText("2 sparade");
    await userEvent.click(listingsCard.getByRole("button", { name: "Ta bort Ljust kontor vid Odenplan från sparade" }));
    await expect(savedProfileApp.toggleFavorite).toHaveBeenCalledWith("office-1");

    const searchesCard = within(document.getElementById("sparade-sokningar"));
    await searchesCard.findByText("Kontor på Södermalm");
    await searchesCard.findByText("Område: Södermalm");
    await userEvent.click(searchesCard.getByRole("button", { name: "Radera Kontor på Södermalm" }));
    await expect(savedProfileApp.deleteSavedFilter).toHaveBeenCalledWith("preset-1");
  }
};

export const CompactLocalPrograms = {
  render: () => <div className="mx-auto max-w-4xl p-6"><LocalProgramModule programs={[{ id: "compact-demo", title: "Lokalprogram 1", district: "Södermalm", type: "Kontor", minSize: 120, maxSize: 160, maxBudget: 90000, moveInDate: "2026-08-21", amenities: ["Mötesrum", "Garage"] }]} onAddProgram={fn()} onEditProgram={fn()} onDeleteProgram={fn()} /></div>
};

// ── AI assistant: the card on Översikt, the button in the corner, and the AI-assistent page ──────────

const assistantApp = () => ({
  ...app,
  user: { ...app.user, name: "Samuel Oldmark", role: "broker", activeRole: "broker", roles: ["broker"] },
  leads: [
    { id: "lead-1", listingId: listings[1].id, status: "new", renter: { name: "Elin Andersson", email: "elin@example.com" }, listing: listings[1], createdAt: daysAgo(1) },
    { id: "lead-2", listingId: listings[0].id, status: "contacted", followUpDate: daysAgo(4).slice(0, 10), renter: { name: "Marcus Nilsson" }, listing: listings[0], createdAt: daysAgo(9) }
  ]
});

function withListings() {
  const original = listingApi.getListings;
  listingApi.getListings = async () => ({ listings });
  return () => {
    listingApi.getListings = original;
  };
}

function BrokerAssistantPreview({ pathname }) {
  const previewApp = assistantApp();
  return (
    <AppShell pathname={pathname} user={previewApp.user} listings={listings} onLogout={app.logout}>
      <BrokerPanelPage app={previewApp} pathname={pathname} />
    </AppShell>
  );
}

export const BrokerAssistantOverview = {
  beforeEach: withListings,
  render: () => <BrokerAssistantPreview pathname="/app/broker" />,
  play: async ({ canvas, userEvent }) => {
    const body = within(document.body);
    // The card only says what to do next: no chat box on the overview, and a way to the full assistant.
    await canvas.findByRole("heading", { name: "Nästa steg" }, { timeout: 5000 });
    await canvas.findByText(/Följ upp Marcus Nilsson/, {}, { timeout: 5000 });
    await expect(canvas.queryByRole("textbox", { name: "Fråga assistenten" })).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /Fråga AI-assistenten/ })).toBeInTheDocument();

    // The button in the corner opens the assistant, which answers questions and takes files.
    await userEvent.click(body.getByRole("button", { name: "Öppna assistenten" }));
    const panel = within(await body.findByRole("dialog", { name: "Assistent" }, { timeout: 4000 }));
    await userEvent.click(panel.getByRole("button", { name: "Vilka leads behöver följas upp?" }));
    await panel.findByText(/1 lead behöver följas upp/, {}, { timeout: 5000 });

    const input = document.querySelector('section[role="dialog"] input[type="file"]');
    await userEvent.upload(input, new File(["blad"], "Portfölj.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    await panel.findByText("Portfölj.xlsx", {}, { timeout: 4000 });
    await userEvent.click(panel.getByRole("button", { name: "Skicka" }));
    await panel.findByText(/Jag har tagit emot Portfölj\.xlsx/, {}, { timeout: 5000 });
    await panel.findByRole("button", { name: "Läs in" }, { timeout: 4000 });

    // Escape closes it again.
    await userEvent.click(panel.getByRole("textbox", { name: "Fråga assistenten" }));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog", { name: "Assistent" })).not.toBeInTheDocument());
  }
};

export const BrokerAssistantFullPage = {
  beforeEach: withListings,
  render: () => <BrokerAssistantPreview pathname="/app/broker/assistent" />,
  play: async ({ canvas, userEvent }) => {
    const body = within(document.body);
    const greeting = await canvas.findByRole("heading", { name: /Hej Samuel! Vad kan jag hjälpa dig med\?/ }, { timeout: 5000 });
    // The button in the corner is left out here: the page is the assistant.
    await expect(body.queryByRole("button", { name: "Öppna assistenten" })).not.toBeInTheDocument();

    // The text box sits right under the greeting, not at the bottom of the page.
    const input = canvas.getByRole("textbox", { name: "Fråga assistenten" });
    await expect(input.closest("footer")).toBeNull();
    await expect(greeting.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // The column beside it holds only the suggested next steps, each with a title and a line of explanation, and it opens and closes.
    const toggle = canvas.getByRole("button", { name: "Föreslagna nästa steg" });
    if (toggle.getAttribute("aria-expanded") !== "true") await userEvent.click(toggle);
    await canvas.findByRole("heading", { name: "Föreslagna nästa steg" });
    // The button is the same one as the side menu's fold button: the plain panel icon at rest (whether the column is open or not, with
    // no fill), and under it the chevron of what a click does, which is to close the column while it is open.
    await expect(toggle.querySelector(".lucide-panel-right")).not.toBeNull();
    await expect(toggle.querySelector(".lucide-panel-right-close")).not.toBeNull();
    await waitFor(() => expect(getComputedStyle(toggle).backgroundColor).toBe("rgba(0, 0, 0, 0)"), { timeout: 3000 });
    await expect(canvas.queryByRole("heading", { name: "Vanliga åtgärder" })).not.toBeInTheDocument();
    const step = await canvas.findByRole("button", { name: /Färdigställ utkastet “Studio i Hornstull”/ });
    await expect(within(step).getByText("Annonsen syns inte för hyresgäster förrän den är publicerad")).toBeInTheDocument();
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle.querySelector(".lucide-panel-right-open")).not.toBeNull();

    // Anything the broker asks is answered in place; the text box then moves to the bottom.
    await userEvent.click(canvas.getByRole("button", { name: /Räkna på hyra/ }));
    await canvas.findByText(/blir 50 000 kr i månaden/, {}, { timeout: 5000 });
    await expect(canvas.getByRole("textbox", { name: "Fråga assistenten" }).closest("footer")).not.toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Ny konversation" }));
    await canvas.findByRole("heading", { name: /Hej Samuel!/ }, { timeout: 4000 });
  }
};

export const AdminAssistantButton = {
  render: () => <AdminPanelPage app={app} pathname="/app/admin" />,
  play: async ({ userEvent }) => {
    const body = within(document.body);
    await userEvent.click(await body.findByRole("button", { name: "Öppna assistenten" }, { timeout: 5000 }));
    const panel = within(await body.findByRole("dialog", { name: "Assistent" }, { timeout: 4000 }));
    // The draft listing counts as something to finish, in the company panel too.
    await panel.findByText(/Färdigställ utkastet “Studio i Hornstull”/, {}, { timeout: 4000 });
    await userEvent.click(panel.getByRole("button", { name: "Stäng assistenten" }));
  }
};

export const PublishFromAssistantFiles = {
  beforeEach: () => {
    queueImportFiles(sampleImportFiles());
  },
  render: () => <PublishOverlayPreview />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Publicera annons" }));
    const dialog = within(await within(document.body).findByRole("dialog", { name: "Publicera annons" }, { timeout: 4000 }));
    // Files handed over by the assistant are read straight away: no start screen, no upload step.
    await dialog.findByRole("heading", { name: "Läser in dina dokument" }, { timeout: 4000 });
    await dialog.findByRole("heading", { name: "Vi hittade 4 objekt" }, { timeout: 12000 });
  }
};

// ── The three-dot menu in the "Åtgärder" column of Dina objekt, Leads and Prospekt ──────────────────

export const ListingRowMenu = {
  beforeEach: () => {
    const original = listingApi.getListings;
    listingApi.getListings = async () => ({ listings });
    return () => {
      listingApi.getListings = original;
    };
  },
  render: () => <BrokerPanelPage app={app} pathname="/app/broker/objekt" />,
  play: async ({ canvas, userEvent }) => {
    const body = within(document.body);
    [app.updateListing, app.publishListing, app.deleteListing].forEach((mock) => mock.mockClear());

    // An active listing can be edited, hidden or deleted; the menu has no other buttons in the row.
    await expect(await canvas.findByRole("button", { name: "Åtgärder för Ljust kontor vid Odenplan" })).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "Redigera" })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Åtgärder för Ljust kontor vid Odenplan" }));
    await body.findByRole("menuitem", { name: "Redigera" }, { timeout: 4000 });
    await expect(body.getByRole("menuitem", { name: "Radera" })).toBeInTheDocument();
    await userEvent.click(body.getByRole("menuitem", { name: "Dölj objekt" }));
    await waitFor(() => expect(app.updateListing).toHaveBeenCalledWith("office-1", { status: "draft" }), { timeout: 4000 });

    // A draft is published from the same place.
    await chooseRowAction(canvas, userEvent, "Studio i Hornstull", "Publicera objekt");
    await waitFor(() => expect(app.publishListing).toHaveBeenCalledWith("office-2"), { timeout: 4000 });

    // Deleting asks first.
    await chooseRowAction(canvas, userEvent, "Flexibelt kontor vid vattnet", "Radera");
    await body.findByRole("alertdialog", {}, { timeout: 4000 });
    await expect(app.deleteListing).not.toHaveBeenCalled();
    await userEvent.click(body.getByRole("button", { name: "Radera objekt" }));
    await waitFor(() => expect(app.deleteListing).toHaveBeenCalledWith("office-3"), { timeout: 4000 });

    // "Redigera" opens the editor.
    await chooseRowAction(canvas, userEvent, "Ljust kontor vid Odenplan", "Redigera");
    await body.findByDisplayValue("Ljust kontor vid Odenplan", {}, { timeout: 5000 });
  }
};

const leadRowApp = { ...assistantApp(), updateLead: fn(async () => {}) };

export const LeadRowMenu = {
  render: () => <BrokerPanelPage app={leadRowApp} pathname="/app/broker/leads" />,
  play: async ({ canvas, userEvent }) => {
    const body = within(document.body);
    leadRowApp.updateLead.mockClear();
    // The status is changed from the menu (it was a select in the row), and the lead opens from it too.
    await userEvent.click(await canvas.findByRole("button", { name: "Åtgärder för Elin Andersson" }));
    // The choices are in a submenu; it is opened and read with the keyboard, since a pointer that jumps to an item closes it on the way.
    (await body.findByRole("menuitem", { name: "Ändra status" }, { timeout: 4000 })).focus();
    await userEvent.keyboard("{ArrowRight}");
    const contacted = await body.findByRole("menuitemradio", { name: "Kontaktad" }, { timeout: 4000 });
    await expect(body.getByRole("menuitemradio", { name: "Ny" })).toHaveAttribute("aria-checked", "true");
    contacted.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(leadRowApp.updateLead).toHaveBeenCalledWith("lead-1", { status: "contacted" }), { timeout: 4000 });

    await chooseRowAction(canvas, userEvent, "Elin Andersson", "Öppna intresseanmälan");
    await body.findByRole("dialog", {}, { timeout: 5000 });
  }
};

export const ProspectRowMenu = {
  beforeEach: () => {
    const restore = withProspectApi();
    const original = prospectsApi.archiveProspect;
    prospectsApi.archiveProspect = fn(async () => ({}));
    return () => {
      restore();
      prospectsApi.archiveProspect = original;
    };
  },
  render: () => <BrokerPanelPage app={app} pathname="/app/broker/prospekt" />,
  play: async ({ canvas, userEvent }) => {
    const body = within(document.body);
    // Archiving asks first, and only then calls the backend.
    await chooseRowAction(canvas, userEvent, "Odenplan – presentation", "Arkivera");
    await body.findByRole("alertdialog", {}, { timeout: 4000 });
    await expect(prospectsApi.archiveProspect).not.toHaveBeenCalled();
    await userEvent.click(body.getByRole("button", { name: "Arkivera prospekt" }));
    await waitFor(() => expect(prospectsApi.archiveProspect).toHaveBeenCalledWith("prospect-1"), { timeout: 4000 });
  }
};
