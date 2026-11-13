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

All other paths render a missing-page screen. In particular /admin and /app/* no longer mount old panels, including when a user already has an admin session. Legacy components remain as dormant source; they are not registered routes. This is route removal, not a replacement dashboard implementation.

Desktop and mobile navigation always expose Logga in and Skapa konto. Auth completion and role defaults return to public listings. Listing requests open directly on the public listing. Saving uses existing favorites API.

## Verification

- Production build passed.
- Auth safety static checks passed.
- Chromium checked public routes, unknown routes and legacy admin/broker/renter paths.
- Clicked desktop login, listing viewing login and mobile signup.
- No browser errors in these checks.
- Live WorkOS credential completion, authenticated save/viewing submissions, and onboarding persistence were not exercised. Existing backend configuration remains unchanged.

## Repository separation

Prior baseline: 5953be41a7d030e21783cd916d5f8703efd11084.
LOA's November 12 reflog shows checkout to site-studio-rebuild, with no rebuild commit. Rebuild existed as local changes.
Remote rentalplatform main remains 8caa3ccbc54efcf005065cd81584d420b83ae1ec and feat/shadcn-full-adoption remains the prior baseline.
No remote restoration required; no writes made to rentalplatform or Office Rental Project.
LOA origin now points to oldmarkdesigns/loa. Existing inherited history is retained.
