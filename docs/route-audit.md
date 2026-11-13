# LOA route audit — 2026-11-13

LOA runs from src/App.jsx with public shared navigation in src/site/SiteChrome.jsx.

## Active routes

- / — landing page
- /lokaler — search, filters and map
- /lokaler/:id — listing, save and viewing request
- /hyresvardar — landlord information
- /login — WorkOS entry, or current session and logout
- /signup — account creation and profile steps
- /callback — authentication completion
- /forgot-password — account recovery
- /onboarding/* — authenticated profile setup
- /prospekt/dela/:token — shared prospect

## Authenticated workspaces

Updated after successful real signup: company administrators return to /app/admin; brokers with granted access return to /app/broker; renter accounts return to /app/profile.

The existing workspace components are now mounted behind authentication and role checks. This explicitly restores the account workspaces requested after signup; the /admin alias stays unregistered. Profile, messages, settings, viewings, publishing, managed listings and prospects are registered for their permitted accounts. Unknown paths render a missing-page screen.

Search mode uses the rebuilt /lokaler page. Switching between search and admin is navigation only: no role grant or active-role mutation. Existing /app/rent links resolve to public search; workspace listing links resolve to public listing details.

Signed-in desktop/mobile navigation shows Admin (when granted) and an account menu instead of Logga in / Skapa konto. Footer and search-page prompts also recognize the session. Normal login resolves the role destination through /callback; an explicit listing return remains supported.

Workspace code loads separately from public pages.

## Verification

- Production build, auth safety checks and account-routing guard tests passed.
- Used the real signed-in account to open its company admin panel, switch to search, and return.
- Full page reload restored the authenticated company workspace.
- Separate signed-out Chromium session denied admin entry.
- Signed-in navigation fixture checked desktop/mobile account controls without fabricating a backend session.
- No new account or company was created during these checks.

## Repository separation

Prior baseline: 5953be41a7d030e21783cd916d5f8703efd11084.
LOA's November 12 reflog shows checkout to site-studio-rebuild, with no rebuild commit. Rebuild existed as local changes.
Remote rentalplatform main remains 8caa3ccbc54efcf005065cd81584d420b83ae1ec and feat/shadcn-full-adoption remains the prior baseline.
No remote restoration required; no writes made to rentalplatform or Office Rental Project.
LOA origin now points to oldmarkdesigns/loa. Existing inherited history is retained.


## Workspace design and preserved interaction

The old panel remains the behavioral reference. The avatar and account dropdown sit at the bottom of the sidebar, alongside its search-mode switch. Profile, company settings and help again open in the existing account window over the current workspace. Navigation groups, sidebar display controls, keyboard commands and page destinations are retained.

The workspace header contains a single Byt till sökläge action, with no Admin/Search tabs. The account dropdown also includes that action. Public search shows an avatar using the former search dropdown actions; Byt till adminläge is a plain text link and dropdown entry, with no filled pill.

Admin content now shares LOA's white surfaces, navy text, hairlines and lighter typography. KPI summaries are an open numeric strip; chart empty states are flat sections; tables, fields, filters and cards share the updated treatment. Existing callbacks and backend operations are retained.

Verified in Chromium with the real components and fixture data: overview, sidebar avatar, profile window open/close, switching to search, search avatar dropdown, returning to admin, and mobile drawer/account controls. Screenshots inspected at desktop and mobile sizes. Build, account-routing and auth-safety checks pass. No account or backend data changed.


## Overlay coverage and radius system

WorkspaceDesignProvider now carries the admin visual identity through React portals. Dialogs, confirmation dialogs, sheets, popovers, select menus, nested dropdowns and tooltips inherit the workspace styling without changing open/close, keyboard, selection or save/discard behavior. The assistant panel, chart tooltip boxes and workspace notifications are covered too.

Shared shape tokens in src/radius.css apply across public pages, account screens, admin and overlays: controls 4px, cards/media 6px, menus/dialogs 8px. Avatars, status dots and switch/radio controls retain their circular meaning. Storybook loads the same shape system. Competing forced-pill and forced-square rules were replaced.

Browser checks covered nested dialog → popover → select, nested confirmation cancel, sheet and dropdown opening/closing, actual listing-editor rendering at desktop/mobile sizes, and absence of workspace-specific portal markers outside the workspace provider. Public CTA/filter/input radii and listing media radii were checked via computed styles. No account or listing data was submitted.

The hosted WorkOS screens are supplied by WorkOS and do not load LOA repository CSS.

Text-input focus uses a single darker field border; additional outline and shadow rings are removed. Checkbox/radio focus and other keyboard controls retain their normal indicators. The hosted WorkOS sign-up form was observed to retain provider-owned styling; LOA's radius CSS does not affect it.
