import { expect, waitFor, within } from "storybook/test";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * The building blocks of the workspace panels in the theme of the toolbar ("Tema"): the surfaces and controls on one page, and the
 * overlays (menu, select, tooltip, popover, dialogs, sheet, calendar) each open on its own. The plays check that what is drawn is
 * what the theme's variables say, so they hold in light and in dark; the `Dark` variants open the same stories in dark mode.
 */
const meta = {
  title: "Components/Theme",
  tags: ["ai-generated", "needs-work"],
  parameters: { layout: "centered" }
};

export default meta;

/**
 * What a variable of the theme is, as the browser writes a colour: the same text getComputedStyle gives for what it colours.
 * It adds and removes an element, so it is not called inside waitFor (whose observer would see that and run again, for ever).
 */
function colorOf(variable, property = "backgroundColor") {
  const probe = document.createElement("div");
  probe.style[property] = `var(${variable})`;
  document.body.appendChild(probe);
  const value = getComputedStyle(probe)[property];
  probe.remove();
  return value;
}

const popup = (element, property = "backgroundColor") => getComputedStyle(element)[property];
const body = () => within(document.body);

/** [r, g, b, alpha] of any CSS colour (a canvas does the parsing, so nothing is added to the page). */
function rgba(color) {
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  context.fillStyle = "#000000";
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a / 255];
}

/** The lines that can be seen round an overlay: its borders, its outline and its ring (a box-shadow without blur, with a spread). */
function edgeColors(element) {
  const style = getComputedStyle(element);
  const colors = [];
  for (const side of ["Top", "Right", "Bottom", "Left"]) {
    if (parseFloat(style[`border${side}Width`]) > 0 && style[`border${side}Style`] !== "none") colors.push(style[`border${side}Color`]);
  }
  if (parseFloat(style.outlineWidth) > 0 && style.outlineStyle !== "none") colors.push(style.outlineColor);
  for (const layer of style.boxShadow.split(/,(?![^(]*\))/)) {
    const color = layer.match(/(rgba?\([^)]*\)|color\([^)]*\)|ok[a-z]+\([^)]*\))/);
    const lengths = layer.replace(color ? color[0] : "", "").trim().split(/\s+/).map(parseFloat);
    if (color && lengths.length >= 4 && lengths[2] === 0 && lengths[3] > 0) colors.push(color[0]);
  }
  return colors.map(rgba).filter(([, , , alpha]) => alpha > 0.04);
}

/** An overlay is edged by a grey line, never a blue one (the default ring colour of Tailwind is a light blue). */
async function expectGreyEdge(element) {
  const edges = edgeColors(element);
  await expect(edges.length).toBeGreaterThan(0);
  for (const [r, , b] of edges) await expect(b - r).toBeLessThan(14);
}

function SurfacesDemo() {
  return (
    <div className="w-[720px] max-w-full space-y-4 bg-canvas p-6 text-strong">
      <Card>
        <CardHeader>
          <CardTitle>Objekt per status</CardTitle>
          <CardDescription>Fördelningen mellan utkast, aktiva och uthyrda objekt.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button>Spara</Button>
            <Button variant="secondary">Bifoga fil</Button>
            <Button variant="outline">Avbryt</Button>
            <Button variant="ghost">Visa mer</Button>
            <Button variant="destructive">Radera</Button>
            <Button disabled>Inaktiv</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Aktiv</Badge>
            <Badge variant="secondary">Utkast</Badge>
            <Badge variant="outline">Uthyrd</Badge>
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">Vunnen</Badge>
            <Badge className="border-rose-200 bg-rose-50 text-rose-700">Förlorad</Badge>
            <Badge className="border-amber-200 bg-amber-50 text-amber-800">Ny</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="theme-title">Titel</Label>
              <Input id="theme-title" defaultValue="Ljust kontor vid Odenplan" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="theme-invalid">Adress</Label>
              <Input id="theme-invalid" disabled placeholder="Låst" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Switch defaultChecked aria-label="Publicerad" />
            <Checkbox defaultChecked aria-label="Fiber" />
            <ToggleGroup defaultValue={["30"]} aria-label="Period">
              <ToggleGroupItem value="7">7 dagar</ToggleGroupItem>
              <ToggleGroupItem value="30">30 dagar</ToggleGroupItem>
              <ToggleGroupItem value="90">90 dagar</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Tabs defaultValue="oversikt">
            <TabsList>
              <TabsTrigger value="oversikt">Översikt</TabsTrigger>
              <TabsTrigger value="leads">Leads</TabsTrigger>
              <TabsTrigger value="prospekt">Prospekt</TabsTrigger>
            </TabsList>
          </Tabs>
          <Progress value={62} aria-label="Klart" />
          <Accordion defaultValue={["a"]}>
            <AccordionItem value="a">
              <AccordionTrigger>Lokalprogram 1</AccordionTrigger>
              <AccordionContent>Södermalm, kontor, upp till 90 000 kr.</AccordionContent>
            </AccordionItem>
          </Accordion>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Annons</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Studio i Hornstull</TableCell>
                <TableCell>Utkast</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// The page, a card and the buttons on it: each takes its colour from the variable the theme sets for it.
export const Surfaces = {
  render: () => <SurfacesDemo />,
  play: async ({ canvas, canvasElement }) => {
    // The colours ease in when the theme is put on (transition-all on the buttons), so they are read until they have arrived.
    const until = (check) => waitFor(check, { timeout: 3000 });
    const expected = {
      card: colorOf("--card"),
      primary: colorOf("--primary"),
      primaryText: colorOf("--primary-foreground", "color"),
      secondary: colorOf("--secondary"),
      // The outline button has the border of the theme, and the stronger one of the fields in dark mode.
      border: colorOf(document.documentElement.classList.contains("dark") ? "--input" : "--border", "borderTopColor")
    };
    await until(() => expect(popup(canvasElement.querySelector('[data-slot="card"]'))).toBe(expected.card));
    const primary = canvas.getByRole("button", { name: "Spara" });
    await until(() => expect(popup(primary)).toBe(expected.primary));
    await until(() => expect(popup(primary, "color")).toBe(expected.primaryText));
    await until(() => expect(popup(canvas.getByRole("button", { name: "Bifoga fil" }))).toBe(expected.secondary));
    await until(() => expect(popup(canvas.getByRole("button", { name: "Avbryt" }), "borderTopColor")).toBe(expected.border));
    // A disabled button is the same button, half see-through in light and more so in dark.
    await expect(Number(popup(canvas.getByRole("button", { name: "Inaktiv" }), "opacity"))).toBeLessThan(0.6);
  }
};

export const SurfacesDark = { ...Surfaces, globals: { theme: "dark" } };

// Keyboard focus is drawn with the ring of the theme.
export const FocusRing = {
  render: () => (
    <div className="flex items-center gap-3 bg-canvas p-6">
      <Button>Första</Button>
      <Input aria-label="Fält" placeholder="Fält" className="w-48" />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const ring = colorOf("--ring", "borderTopColor");
    await userEvent.tab();
    const button = canvas.getByRole("button", { name: "Första" });
    await expect(button).toHaveFocus();
    await waitFor(() => expect(popup(button, "borderTopColor")).toBe(ring), { timeout: 3000 });
    await userEvent.tab();
    const field = canvas.getByRole("textbox", { name: "Fält" });
    await expect(field).toHaveFocus();
    await waitFor(() => expect(popup(field, "borderTopColor")).toBe(ring), { timeout: 3000 });
  }
};

export const FocusRingDark = { ...FocusRing, globals: { theme: "dark" } };

function MenuStory() {
  return (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger render={<Button variant="outline">Åtgärder</Button>} />
      <DropdownMenuContent className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Annons</DropdownMenuLabel>
          <DropdownMenuItem>Redigera</DropdownMenuItem>
          <DropdownMenuItem>Duplicera</DropdownMenuItem>
          <DropdownMenuCheckboxItem checked>Visa i sökflödet</DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value="aktiv">
          <DropdownMenuRadioItem value="utkast">Utkast</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="aktiv">Aktiv</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Radera</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// A menu is the popover surface, and the item under the pointer takes the accent.
export const Menu = {
  render: () => (
    <div className="h-[340px] w-[320px] bg-canvas p-6">
      <MenuStory />
    </div>
  ),
  play: async ({ userEvent }) => {
    const menu = await body().findByRole("menu", {}, { timeout: 4000 });
    await expect(popup(menu)).toBe(colorOf("--popover"));
    await expectGreyEdge(menu);
    const item = body().getByRole("menuitem", { name: "Duplicera" });
    await userEvent.hover(item);
    await waitFor(() => expect(item).toHaveAttribute("data-highlighted"));
    await expect(popup(item)).toBe(colorOf("--accent"));
  }
};

export const MenuDark = { ...Menu, globals: { theme: "dark" } };

function SelectStory() {
  return (
    <Select defaultOpen defaultValue="kontor">
      <SelectTrigger className="w-56" aria-label="Typ">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="kontor">Kontor</SelectItem>
        <SelectItem value="studio">Studio</SelectItem>
        <SelectItem value="butik">Butik</SelectItem>
      </SelectContent>
    </Select>
  );
}

export const SelectOpen = {
  render: () => (
    <div className="h-[260px] w-[320px] bg-canvas p-6">
      <SelectStory />
    </div>
  ),
  play: async () => {
    const list = await body().findByRole("listbox", {}, { timeout: 4000 });
    const content = list.closest('[data-slot="select-content"]') ?? list;
    await expect(popup(content)).toBe(colorOf("--popover"));
    await expectGreyEdge(content);
    await expect(body().getByRole("option", { name: "Kontor" })).toHaveAttribute("aria-selected", "true");
  }
};

export const SelectOpenDark = { ...SelectOpen, globals: { theme: "dark" } };

// The tooltip is the inverse of the page: the foreground colour with the background colour on it.
export const TooltipOpen = {
  render: () => (
    <div className="flex h-[140px] w-[320px] items-end justify-center bg-canvas p-6">
      <Tooltip defaultOpen>
        <TooltipTrigger render={<Button variant="outline">Sammanfoga</Button>} />
        <TooltipContent>Slår ihop två annonser</TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async () => {
    const tip = await waitFor(() => {
      const found = document.querySelector('[data-slot="tooltip-content"]');
      expect(found).not.toBeNull();
      return found;
    }, { timeout: 4000 });
    await expect(popup(tip)).toBe(colorOf("--foreground"));
    await expect(popup(tip, "color")).toBe(colorOf("--background", "color"));
  }
};

export const TooltipOpenDark = { ...TooltipOpen, globals: { theme: "dark" } };

export const PopoverOpen = {
  render: () => (
    <div className="h-[280px] w-[360px] bg-canvas p-6">
      <Popover defaultOpen>
        <PopoverTrigger render={<Button variant="outline">Filter</Button>} />
        <PopoverContent align="start">
          <PopoverHeader>
            <PopoverTitle>Filtrera leads</PopoverTitle>
            <PopoverDescription>Välj vilka leads som visas.</PopoverDescription>
          </PopoverHeader>
          <Input aria-label="Sök" placeholder="Sök namn" />
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async () => {
    const content = await waitFor(() => {
      const found = document.querySelector('[data-slot="popover-content"]');
      expect(found).not.toBeNull();
      return found;
    }, { timeout: 4000 });
    await expect(popup(content)).toBe(colorOf("--popover"));
    await expectGreyEdge(content);
    await expect(popup(within(content).getByText("Filtrera leads"), "color")).toBe(colorOf("--popover-foreground", "color"));
  }
};

export const PopoverOpenDark = { ...PopoverOpen, globals: { theme: "dark" } };

// Dialogs: the panel is the popover surface, and what is behind it is dimmed (more on a dark page, which is already dark).
export const DialogOpen = {
  render: () => (
    <div className="h-[420px] w-[560px] bg-canvas p-6 text-strong">
      <p>Sidan bakom dialogen</p>
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Byt namn på annonsen</DialogTitle>
            <DialogDescription>Namnet syns i sökflödet.</DialogDescription>
          </DialogHeader>
          <Input aria-label="Namn" defaultValue="Ljust kontor vid Odenplan" />
          <DialogFooter>
            <Button variant="outline">Avbryt</Button>
            <Button>Spara</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  ),
  play: async () => {
    const dialog = await body().findByRole("dialog", {}, { timeout: 4000 });
    await expect(popup(dialog)).toBe(colorOf("--popover"));
    await expectGreyEdge(dialog);
    const scrim = document.querySelector('[data-slot="dialog-overlay"]');
    await expect(scrim).not.toBeNull();
    // Black at 10 % on a light page, at 55 % on a dark one.
    await expect(popup(scrim)).toMatch(document.documentElement.classList.contains("dark") ? /0\.55\)$/ : /0\.1\)$/);
  }
};

export const DialogOpenDark = { ...DialogOpen, globals: { theme: "dark" } };

export const AlertDialogOpen = {
  render: () => (
    <div className="h-[360px] w-[560px] bg-canvas p-6">
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Radera annonsen?</AlertDialogTitle>
            <AlertDialogDescription>Det går inte att ångra.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction variant="destructive">Radera</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  ),
  play: async () => {
    const dialog = await body().findByRole("alertdialog", {}, { timeout: 4000 });
    await expect(popup(dialog)).toBe(colorOf("--popover"));
    await expectGreyEdge(dialog);
    await expect(popup(within(dialog).getByRole("button", { name: "Avbryt" }))).not.toBe("rgba(0, 0, 0, 0)");
  }
};

export const AlertDialogOpenDark = { ...AlertDialogOpen, globals: { theme: "dark" } };

export const SheetOpen = {
  render: () => (
    <div className="h-[420px] w-[560px] bg-canvas p-6">
      <Sheet defaultOpen>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Annonsöversikt</SheetTitle>
            <SheetDescription>Studio i Hornstull</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  ),
  play: async () => {
    const sheet = await body().findByRole("dialog", {}, { timeout: 4000 });
    await expect(popup(sheet)).toBe(colorOf("--popover"));
    await expectGreyEdge(sheet);
  }
};

export const SheetOpenDark = { ...SheetOpen, globals: { theme: "dark" } };

// The date picker: the chosen day is the primary colour, today and the days next to the month are quieter.
export const CalendarOpen = {
  render: () => (
    <Card className="w-fit bg-card">
      <CardContent className="p-2">
        <Calendar mode="single" defaultMonth={new Date(2026, 8, 1)} selected={new Date(2026, 8, 21)} />
      </CardContent>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const chosen = await waitFor(() => {
      const found = canvasElement.querySelector('[data-selected-single="true"]');
      expect(found).not.toBeNull();
      return found;
    }, { timeout: 4000 });
    await expect(popup(chosen)).toBe(colorOf("--primary"));
    await expect(popup(chosen, "color")).toBe(colorOf("--primary-foreground", "color"));
  }
};

export const CalendarOpenDark = { ...CalendarOpen, globals: { theme: "dark" } };
