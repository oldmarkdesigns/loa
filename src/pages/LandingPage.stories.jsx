import { expect, waitFor, within } from "storybook/test";
import LandingPage from "./LandingPage";
import { calculateTotalOccupancyCost } from "../lib/tocCalculator";
import { formatSek } from "../lib/formatters";

const meta = {
  title: "Pages/Landing page",
  component: LandingPage,
  tags: ["ai-generated", "needs-work"],
  // The landing page is light on purpose (only the workspace panels have a dark theme), so the toolbar's theme does not apply.
  parameters: { layout: "fullscreen", themeFrame: false }
};

export default meta;

// The search card of the hero is wrapped in a border beam (`pulse-inner`, in `mono`): a quiet breathing glow along the inside of its
// edge. It comes in once the card has risen into place, takes the card's corner by itself, and leaves the frosted glass and the
// fields as they were.
export const HeroSearchBeam = {
  play: async ({ canvas, userEvent }) => {
    const search = await canvas.findByRole("button", { name: "Sök lokaler" });
    const card = search.closest(".hero-load-search");
    await expect(card).not.toBeNull();
    const wrapper = card.closest("[data-beam]");
    await expect(wrapper).not.toBeNull();
    await expect(card.parentElement).toBe(wrapper);

    // The beam waits for the card, then plays.
    await waitFor(() => expect(wrapper).toHaveAttribute("data-active"), { timeout: 5000 });

    // The wrapper has the card's 20px corner, and is not itself something that would cut the glass off from the image behind it
    // (an opacity, a filter or a mask on an ancestor makes the blur see nothing but that ancestor).
    await expect(getComputedStyle(card).borderTopLeftRadius).toBe("20px");
    await expect(getComputedStyle(wrapper).borderTopLeftRadius).toBe("20px");
    await expect(getComputedStyle(card).backdropFilter).toContain("blur");
    await expect(getComputedStyle(wrapper).opacity).toBe("1");
    await expect(getComputedStyle(wrapper).filter).toBe("none");
    await expect(getComputedStyle(wrapper).maskImage).toBe("none");

    // The fields are the fields they were.
    const inCard = within(card);
    const teamSize = inCard.getByPlaceholderText("Hur många är ni?");
    await userEvent.type(teamSize, "12");
    await expect(teamSize).toHaveValue(12);
    await expect(inCard.getByText("Antal platser")).toBeVisible();
    await expect(inCard.getByText("Plats")).toBeVisible();
  }
};

// getByText's default normalizer collapses the DOM's own text (incl. formatSek's non-breaking
// thousands separator) to a plain space before comparing — but leaves a plain-string matcher
// untouched, so a raw formatSek() call as the query never matches. Normalize it too.
const NBSP = String.fromCharCode(160);
const plainSek = (value) => formatSek(value).split(NBSP).join(" ");

const answers = {
  baseRentPerYear: 450000,
  sizeSqm: 300,
  operatingCostPerYear: 70000,
  propertyTaxPerYear: 35000,
  oneTimeFitOutCost: 250000,
  depositAmount: 150000,
  termYears: 5
};
const orderedKeys = Object.keys(answers);
const questionByKey = {
  baseRentPerYear: "Vad blir bashyran per år?",
  sizeSqm: "Hur många kvadratmeter gäller det?",
  operatingCostPerYear: "Vad kostar driften per år?",
  propertyTaxPerYear: "Vad blir fastighetsskatten per år?",
  oneTimeFitOutCost: "Någon engångskostnad för anpassning av lokalen?",
  depositAmount: "Hur stor är depositionen?",
  termYears: "Sist: hur många år är avtalet?"
};

// Fristående (no listing, no login, no platform data) — one question at a time, the exact same
// pattern as "Nytt lokalprogram" / "Publicera annons" (PublishStage + an orb that acknowledges
// then works between steps). The result card is visible from the start with blank rows, fills
// in as each cost component is answered, then a short calculating beat before the real total.
export const TocCalculator = {
  play: async ({ userEvent }) => {
    const section = document.getElementById("toc-kalkylator");
    await expect(section).not.toBeNull();
    const withinSection = within(section);

    // PublishStage's heading has its own fade/slide entrance animation, so the very first tick
    // can read as opacity:0 — same race as AssistantKit's messages, same fix (retry).
    await waitFor(() => expect(withinSection.getByText(questionByKey.baseRentPerYear)).toBeVisible(), { timeout: 3000 });

    // Blank from the start — nothing answered yet.
    await expect(withinSection.getAllByText("—").length).toBeGreaterThanOrEqual(4);

    for (let index = 0; index < orderedKeys.length; index++) {
      const key = orderedKeys[index];
      const input = withinSection.getByRole("spinbutton");
      await userEvent.clear(input);
      await userEvent.type(input, String(answers[key]));
      await userEvent.click(withinSection.getByRole("button", { name: /Nästa|Kalkylera/ }));

      if (index < orderedKeys.length - 1) {
        const nextQuestion = questionByKey[orderedKeys[index + 1]];
        await waitFor(() => expect(withinSection.getByText(nextQuestion)).toBeVisible(), { timeout: 3000 });
      }
    }

    // Bashyra was the first answer — its preview row should have filled in immediately, well
    // before the flow reached the end (this only re-checks it's still there, proving the reveal
    // is per-row and permanent, not a one-shot flash).
    await expect(withinSection.getByText(`${plainSek(answers.baseRentPerYear)}/år`)).toBeVisible();

    // The calculating beat is a real, if brief, wait — not an instant swap. "Kalkylera" also goes
    // through the same ~1s received/processing choreography as every other step before
    // runCalculation() even starts, so this needs more than the default 1000ms find timeout.
    await expect(await withinSection.findByText(/Analyserar underlaget|Räknar ihop totalkostnaden/, {}, { timeout: 3000 })).toBeVisible();

    const expected = calculateTotalOccupancyCost(answers);
    await waitFor(() => expect(withinSection.getByText(`Totalt över ${expected.termYears} år`)).toBeVisible(), { timeout: 4000 });
    await expect(withinSection.getByText(plainSek(expected.totalTermCost))).toBeVisible();
    await expect(withinSection.getByText(plainSek(expected.averageAnnualCost))).toBeVisible();
    await expect(
      withinSection.getByText(
        (_, node) => node?.tagName === "P" && Boolean(node?.textContent?.includes(`Deposition (${formatSek(expected.deposit)})`))
      )
    ).toBeVisible();

    // Starting over really starts over: back to the first question, preview blank again.
    await userEvent.click(withinSection.getByRole("button", { name: "Börja om" }));
    await waitFor(() => expect(withinSection.getByText(questionByKey.baseRentPerYear)).toBeVisible(), { timeout: 3000 });
    await expect(withinSection.getAllByText("—").length).toBeGreaterThanOrEqual(4);
    await expect(withinSection.getByRole("spinbutton")).toHaveValue(null);
  }
};
