/**
 * The size of what is in the side menu and in the menus that open from it: a row is 38px tall with 14px text and an 18px icon.
 * They are here, in one place, so that the pages, the way over to searching, the search bar, the profile menu and the rows of
 * the search palette keep one rhythm, and a change of density is one edit (PanelSidebar.stories.jsx states the resulting pixels).
 *
 * `min-h-0` and `!rounded-md` are needed because the platform gives every button a 42px minimum height and a 0.75rem radius
 * with !important (see src/index.css).
 */

/** The height of a row. */
export const menuHeight = "h-[38px]";

/** A row of the menu: a page, the way over to searching, an entry of the profile menu. */
export const menuRow = `${menuHeight} min-h-0 w-full !rounded-md text-sm font-normal focus-visible:ring-veil/20`;

/** How a row lays out its icon and its label. */
export const menuRowInset = "justify-start gap-2.5 px-3";

/** A row that is only its icon, in the folded rail. */
export const menuRowIconOnly = "justify-center px-0";

/** The icon of a row. */
export const menuIcon = "size-[18px] shrink-0";

/** A square control as tall as a row: the fold and close buttons, and the mark and the avatar of the folded rail. */
export const menuSquare = "size-[38px]";

/** A quiet icon button of the header: the fold button, the close button, the chevron of the display menu. */
export const menuQuietButton = "min-h-0 shrink-0 !rounded-md px-0 text-ink-600 hover:bg-veil/5 hover:text-strong focus-visible:ring-veil/20";
