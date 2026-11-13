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


## Workspace navigation design

Admin and broker navigation now share a branded LOA header with Sök lokaler / Admin and the account menu. Side navigation uses the site's typography, navy ink, white surfaces and hairline separation, with a compact rail retained for users who choose it.

Account pages now render as full pages rather than settings dialogs. Profile, saved items, local programs, company profile, settings and help share section navigation; mobile uses a horizontally scrollable page list. Existing forms and data operations are retained.

Company-admin profile links from public search resolve to the same profile navigation. Profile page selection, saved-page selection, account menu and mobile overflow were checked in Chromium using the actual components with fixture data. The real signed-in workspace header and sidebar were also inspected. No account data was changed.
