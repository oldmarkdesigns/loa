/**
 * Helpers for the keyboard shortcuts of the workspace's side menu (⌘K opens the search, ⌘B folds the menu).
 */

const platform = () => {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || "";
};

/** Whether the shortcut key of this computer is ⌘ (a Mac, an iPad) rather than Ctrl. */
export const usesCommandKey = () => /mac|iphone|ipad/i.test(platform());

/** The shortcut as it is written on screen: "⌘K" on a Mac, "Ctrl K" elsewhere. */
export const shortcutLabel = (key) => (usesCommandKey() ? `⌘${key}` : `Ctrl ${key}`);

/** Whether the shortcut key (⌘ or Ctrl) is held down on its own, without Shift or Alt. */
export const hasShortcutModifier = (event) => (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey;

/** Whether what has the keyboard is somewhere text is typed, where a letter with ⌘ or Ctrl belongs to the field (bold, for one). */
export function isTypingTarget(target) {
  if (typeof Element === "undefined" || !(target instanceof Element)) return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]'));
}

/** Whether the keyboard is inside a dialog or a sheet (an editor, a confirmation) that a shortcut of the menu should not open over. */
export function isInsideDialog(target) {
  if (typeof Element === "undefined" || !(target instanceof Element)) return false;
  return Boolean(target.closest('[role="dialog"], [role="alertdialog"]'));
}
