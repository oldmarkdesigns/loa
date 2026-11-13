import { AuthKitProvider } from "@workos-inc/authkit-react";
import { expect, within } from "storybook/test";
import LandingPage from "./LandingPage";
import { calculateTotalOccupancyCost } from "../lib/tocCalculator";

// The public homepage, built on the site frame (src/site). The bar's sign-in needs AuthKit, so the story gives it a provider
// with a placeholder client, as main.jsx does when no client id is configured.
const meta = {
  title: "Pages/Landing page",
  component: LandingPage,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen", themeFrame: false },
  decorators: [
    (Story) => (
      <AuthKitProvider clientId="client_placeholder" devMode>
        <Story />
      </AuthKitProvider>
    )
  ]
};

export default meta;

export const Default = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1 })).toHaveTextContent("Lediga kontor och lokaler i Stockholm");
    await expect(canvas.getByRole("search", { name: "Sök lokaler" })).toBeInTheDocument();
    // Every area on the dot map is a real button with its count.
    await expect(await canvas.findByRole("button", { name: /^Södermalm, \d+ lokal/ })).toBeInTheDocument();
  }
};

// The calculator sums as you type: base rent, operating cost and property tax per year over the term, plus the one-off fit-out.
export const TocCalculator = {
  play: async ({ canvasElement, userEvent }) => {
    const calculator = within(canvasElement.querySelector("#kalkylator"));
    await userEvent.click(calculator.getByRole("button", { name: "Töm fälten" }));
    const values = { "Bashyra (kr/år)": 100000, "Drift (kr/år)": 20000, "Fastighetsskatt (kr/år)": 5000, "Anpassning, engångs (kr)": 50000, "Avtalslängd (år)": 3 };
    for (const [label, value] of Object.entries(values)) {
      await userEvent.type(calculator.getByLabelText(label), String(value));
    }
    const expected = calculateTotalOccupancyCost({ baseRentPerYear: 100000, operatingCostPerYear: 20000, propertyTaxPerYear: 5000, oneTimeFitOutCost: 50000, termYears: 3 });
    await expect(calculator.getByText(`${expected.totalTermCost.toLocaleString("sv-SE")} kr`)).toBeInTheDocument();
  }
};
