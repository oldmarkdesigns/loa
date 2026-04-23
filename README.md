# Office Flow Prototype

Office-rental marketplace prototype with WorkOS auth and a Convex backend.

## Stack
- Vite
- React
- Tailwind CSS
- WorkOS AuthKit
- Convex

## Main flows
- Tenant flow: standard search, AI chat search, shortlist, booking request
- Owner flow: self-serve listing wizard, review and publish, lead pipeline snapshot

## Run
1. Install dependencies:
   `npm install`
2. Start Convex in one terminal:
   `npm run convex:dev`
3. Start Vite in a second terminal:
   `npm run dev`
4. Build:
   `npm run build`

## Notes
- The first app boot seeds Convex with the local sample listings from `src/data/mockData.js`.
- For local auth, configure WorkOS CORS for `http://localhost:5173`, set the redirect URI to `/callback`, and set the sign-in endpoint to `/login`.
- After adding `convex/auth.config.js` or changing auth providers, run `npm run convex:dev` again so the backend picks up the new config.
