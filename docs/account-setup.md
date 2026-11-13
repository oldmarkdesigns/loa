# LOA account infrastructure

Configured November 13, 2026 for local development.

- Convex team/project: samuel-oldmark / loa
- Deployment: dev:notable-rabbit-616 (Europe/Ireland)
- Client URL: https://notable-rabbit-616.eu-west-1.convex.cloud
- WorkOS environment: environment_01M7A4PNXWGAQ3TYCWPEZCYM2Y
- WorkOS client: client_01M7A4PP7J4WKD363A1AMZQXZ9

The backend schema and functions have been deployed to this new development deployment. WORKOS_CLIENT_ID is set on that deployment. Local .env.local uses the same client and deployment. No old deployment data was imported.

convex.json intentionally has no authKit provisioning configuration: use the explicitly selected existing WorkOS environment, rather than creating one during deployment. No WorkOS API secret is needed in the browser or for Convex JWT verification.

## WorkOS application settings

- Default callback: http://localhost:5173/callback
- Initiate login: http://localhost:5173/login
- Sign-out: http://localhost:5173/
- Allowed CORS origin: http://localhost:5173

Use localhost, not 127.0.0.1, for the local app.

## Verification

Backend deploy succeeded. listings:list returns an empty collection on the new database; users:me returns null without an authenticated identity. Build and auth safety checks pass.

Clicked LOA login in Chromium: reached the selected environment's AuthKit sign-in page with the correct client and callback. WorkOS's hosted page logs report-only CSP diagnostics and a missing favicon; the sign-in form renders.

Password recovery now opens hosted WorkOS authentication rather than falsely claiming a reset email was sent. Select the recovery option in the hosted email/password journey.

A real user's signup, email verification, callback/token exchange, profile persistence, session refresh and logout still require an interactive test. No test credentials or fake accounts were created.

## Hosted deployment

This is a development setup, not a production launch. Once LOA's hosted URL is selected, add its exact callback, sign-out and CORS URLs to the intended WorkOS environment and set matching VITE_* build variables on that frontend host. Production Convex deployment requires separate explicit target selection. Never deploy LOA to rentalplatform's backend.

Only LOA files and the specified services were changed. rentalplatform and Office Rental Project were not modified.
