import { expect } from "storybook/test";
import { SIDEBAR_DISPLAY_KEY, SIDEBAR_MODES, readSidebarMode } from "./sidebarDisplay";

// Not a component: how the side menu's display is read from what is stored. Nothing is drawn.
const meta = {
  title: "Lib/Sidebar display",
  tags: ["ai-generated", "needs-work"],
  render: () => <p className="p-4 text-sm">Se Interactions.</p>
};

export default meta;

const storage = (value) => ({ getItem: () => value });

// The display is one of three words; anything else that is stored is ignored and the menu starts expanded.
export const ReadingWhatIsStored = {
  play: async () => {
    await expect(SIDEBAR_MODES).toEqual(["expanded", "collapsed", "hover"]);
    for (const mode of SIDEBAR_MODES) await expect(readSidebarMode(storage(mode))).toBe(mode);

    await expect(readSidebarMode(storage(null))).toBe("expanded");
    await expect(readSidebarMode(storage(undefined))).toBe("expanded");
    await expect(readSidebarMode(storage(""))).toBe("expanded");
    await expect(readSidebarMode(storage("sideways"))).toBe("expanded");
    await expect(readSidebarMode(storage("{}"))).toBe("expanded");
    await expect(readSidebarMode(storage(JSON.stringify({ pinned: "yes", rest: "hover" })))).toBe("expanded");
    await expect(readSidebarMode({ getItem: () => { throw new Error("blocked"); } })).toBe("expanded");
    await expect(SIDEBAR_DISPLAY_KEY).toBe("office_rental_sidebar_display");
  }
};

// The first version kept `{ pinned, rest }`: a browser that has that stored keeps what it chose.
export const KeepsWhatTheFirstVersionStored = {
  play: async () => {
    const earlier = (value) => readSidebarMode(storage(JSON.stringify(value)));
    await expect(earlier({ pinned: true, rest: "collapsed" })).toBe("expanded");
    await expect(earlier({ pinned: true, rest: "hover" })).toBe("expanded");
    await expect(earlier({ pinned: false, rest: "hover" })).toBe("hover");
    await expect(earlier({ pinned: false, rest: "collapsed" })).toBe("collapsed");
    await expect(earlier({ pinned: false })).toBe("collapsed");
  }
};
