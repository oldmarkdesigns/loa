import { expect, fireEvent, fn, waitFor, within } from "storybook/test";
import LocalProgramFlow from "./LocalProgramFlow";

const meta = {
  component: LocalProgramFlow,
  tags: ["ai-generated", "needs-work"],
  parameters: { layout: "fullscreen" },
  args: {
    existingCount: 1,
    onCreate: fn(async (program) => program),
    onShowMatches: fn(),
    onClose: fn()
  }
};

export default meta;

async function openFlow() {
  const dialog = within(await within(document.body).findByRole("dialog", { name: "Nytt lokalprogram" }, { timeout: 4000 }));
  const question = (name) => dialog.findByRole("heading", { name }, { timeout: 8000 });
  return { dialog, question };
}

// Answers a field in one change. userEvent.type only reaches React's onChange while the preview frame has focus, which
// the browser pane does not always give it, so values are entered like this and userEvent is kept for clicks and Enter.
const fill = (field, value) => fireEvent.change(field, { target: { value } });

// The person's own words, in the summary and once the program is created: a row of its own below the other values, the label
// above the text, and the text read from the left (a long text in the narrow column of a value looked like a ragged strip).
async function expectOwnWordsRow(dialog, text) {
  const label = dialog.getByText("Egna önskemål");
  const row = label.closest("div");
  const list = row.parentElement;
  const box = (element) => element.getBoundingClientRect();
  const others = Array.from(list.children).filter((child) => child !== row);
  await expect(others.length).toBeGreaterThan(0);
  await expect(Math.abs(box(row).width - box(list).width)).toBeLessThan(2);
  await expect(box(row).top).toBeGreaterThanOrEqual(Math.max(...others.map((child) => box(child).bottom)) - 1);
  const words = row.querySelector("dd");
  await expect(words).toHaveTextContent(text);
  await expect(["left", "start"]).toContain(getComputedStyle(words).textAlign);
  await expect(Math.abs(box(words).left - box(label).left)).toBeLessThan(1);
  await expect(box(words).top).toBeGreaterThanOrEqual(box(label).bottom - 1);
}

// One question at a time, like "Publicera annons", and the program is only stored when the summary is confirmed.
export const AnswerTheQuestions = {
  play: async ({ userEvent, args }) => {
    args.onCreate.mockClear();
    const { dialog, question } = await openFlow();
    const next = () => userEvent.click(dialog.getByRole("button", { name: "Nästa" }));

    await question("Hur vill du skapa lokalprogrammet?");
    await userEvent.click(dialog.getByRole("button", { name: /Svara på frågor/ }));

    // The name is required, so an empty answer is refused where it is given.
    await question("Vad vill du kalla lokalprogrammet?");
    await next();
    await dialog.findByText("Ge lokalprogrammet ett namn.");
    fill(dialog.getByRole("textbox", { name: /Namn/ }), "Huvudkontor");
    await userEvent.type(dialog.getByRole("textbox", { name: /Namn/ }), "{Enter}");

    await question("Var vill ni sitta, och vilken typ av lokal söker ni?");
    await next();
    await question("Hur stor lokal behöver ni?");
    fill(dialog.getByRole("spinbutton", { name: /Platser/ }), "12");
    fill(dialog.getByRole("spinbutton", { name: /Minsta yta/ }), "150");
    fill(dialog.getByRole("spinbutton", { name: /Största yta/ }), "250");
    await userEvent.type(dialog.getByRole("spinbutton", { name: /Största yta/ }), "{Enter}");
    await question("Vad får lokalen kosta?");
    fill(dialog.getByRole("spinbutton", { name: /Högsta hyra/ }), "90000");
    await userEvent.type(dialog.getByRole("spinbutton", { name: /Högsta hyra/ }), "{Enter}");
    await question("När vill ni flytta in?");
    await next();
    await question("Hur ska vardagen i lokalen fungera?");
    await next();
    await question("Finns det särskilda krav?");
    await userEvent.click(dialog.getByRole("checkbox", { name: "Tillgänglighetsanpassad" }));
    await next();
    await question("Vad ska lokalen ha?");
    await userEvent.click(dialog.getByRole("button", { name: "Mötesrum" }));
    await next();
    await question("Något mer vi bör veta?");
    fill(dialog.getByRole("textbox", { name: /Egna önskemål/ }), "Tydlig entré.");
    await next();

    // The summary shows what was answered; nothing has been stored yet.
    await question("Ser allt rätt ut?");
    await expect(dialog.getByText("Huvudkontor")).toBeInTheDocument();
    await expect(dialog.getByText("12 platser")).toBeInTheDocument();
    await expect(dialog.getByText("150–250 kvm")).toBeInTheDocument();
    await expect(dialog.getByText("Upp till 90 000 kr")).toBeInTheDocument();
    await expect(dialog.getByText("Mötesrum")).toBeInTheDocument();
    await expect(args.onCreate).not.toHaveBeenCalled();
    await userEvent.click(dialog.getByRole("button", { name: "Skapa lokalprogram" }));

    await dialog.findByRole("heading", { name: "Lokalprogrammet är skapat" }, { timeout: 4000 });
    await expect(args.onCreate).toHaveBeenCalledWith(expect.objectContaining({
      title: "Huvudkontor",
      teamSize: "12",
      minSize: "150",
      maxSize: "250",
      maxBudget: "90000",
      accessibilityAdapted: true,
      amenities: "Mötesrum",
      contextNotes: { Övrigt: "Tydlig entré." }
    }));
    await userEvent.click(dialog.getByRole("button", { name: /Visa matchande lokaler/ }));
    await expect(args.onShowMatches).toHaveBeenCalledWith(expect.objectContaining({ title: "Huvudkontor" }));
  }
};

// The other way in: write what you are looking for, see what was understood, and change what is wrong.
export const DescribeInOwnWords = {
  play: async ({ userEvent, args }) => {
    args.onCreate.mockClear();
    const { dialog, question } = await openFlow();

    await question("Hur vill du skapa lokalprogrammet?");
    await userEvent.click(dialog.getByRole("button", { name: /Beskriv med egna ord/ }));
    await question("Vad letar ni efter?");
    await expect(dialog.getByRole("button", { name: "Läs in beskrivningen" })).toBeDisabled();
    await userEvent.click(dialog.getByRole("button", { name: "Kontor för ett team" }));
    await userEvent.click(dialog.getByRole("button", { name: "Läs in beskrivningen" }));

    await question("Läser din beskrivning");
    await question("Ser allt rätt ut?");
    await dialog.findByText("Så här förstod jag din beskrivning");
    await expect(dialog.getByText("Kontor på Södermalm")).toBeInTheDocument();
    await expect(dialog.getByText("12 platser")).toBeInTheDocument();
    await expect(dialog.getByText("200–250 kvm")).toBeInTheDocument();
    await expect(dialog.getByText("Upp till 90 000 kr")).toBeInTheDocument();
    await expect(dialog.getByText(/^1 januari/)).toBeInTheDocument();
    await expect(dialog.getByText("Kök, Mötesrum")).toBeInTheDocument();
    await expectOwnWordsRow(dialog, /^Vi är 12 personer och söker kontor på Södermalm/);

    // "Ändra" answers that one question again and comes straight back to the summary.
    await userEvent.click(dialog.getByRole("button", { name: "Ändra namn" }));
    await question("Vad vill du kalla lokalprogrammet?");
    fill(dialog.getByRole("textbox", { name: /Namn/ }), "Teamet på Söder");
    await userEvent.click(dialog.getByRole("button", { name: "Klar" }));
    await question("Ser allt rätt ut?");
    await userEvent.click(dialog.getByRole("button", { name: "Skapa lokalprogram" }));
    await dialog.findByRole("heading", { name: "Lokalprogrammet är skapat" }, { timeout: 4000 });
    await expectOwnWordsRow(dialog, /^Vi är 12 personer och söker kontor på Södermalm/);
    await expect(args.onCreate).toHaveBeenCalledWith(expect.objectContaining({
      title: "Teamet på Söder",
      district: "Södermalm",
      type: ["Kontor"],
      teamSize: "12",
      minSize: "200",
      maxSize: "250",
      maxBudget: "90000"
    }));
  }
};

// Text with nothing to read in it goes back to the description instead of an empty summary.
export const NothingUnderstood = {
  play: async ({ userEvent }) => {
    const { dialog, question } = await openFlow();
    await question("Hur vill du skapa lokalprogrammet?");
    await userEvent.click(dialog.getByRole("button", { name: /Beskriv med egna ord/ }));
    await question("Vad letar ni efter?");
    fill(dialog.getByRole("textbox", { name: "Beskriv lokalen ni söker" }), "hej");
    await userEvent.click(dialog.getByRole("button", { name: "Läs in beskrivningen" }));
    await dialog.findByText(/Jag hittade inga uppgifter att fylla i/, {}, { timeout: 8000 });
    await waitFor(() => expect(dialog.getByRole("heading", { name: "Vad letar ni efter?" })).toBeInTheDocument());
  }
};
