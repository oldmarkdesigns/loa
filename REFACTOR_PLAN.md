## 1. Current state summary

### What the app currently does

This is a Vite + React single-page application for office rental classifieds in Stockholm. It supports:

* Public browsing of listings.
* Search and filtering for office spaces.
* Listing detail pages with image gallery, map/street-view style UI, listing metadata, and enquiry entry points.
* Authenticated renter flows: save favourites, request viewings, view own requests, profile/settings.
* Authenticated broker/landlord flows: create listings, edit own listings, publish listings, view leads.
* Company admin flow: an admin-style dashboard, mostly prototype/demo data.
* WorkOS AuthKit sign-in/sign-up flow.
* Convex-backed persistence for users, listings, favourites, viewings and leads.

The visual product direction is coherent: rounded surfaces, restrained colours, Stockholm-office imagery, card-based listing browsing, polished marketing and app shells. This should not be redesigned during professionalisation.

### Main user roles

The code effectively has these roles:

* `renter`, the default tenant role.
* `broker`, the current normalised landlord/publisher role.
* `company_admin`, a broker-like role with access to `/app/admin`.
* `publisher`, an older role name still present in seed data and some legacy components.
* Guest/unauthenticated users, who can browse `/`, `/app/rent`, and public listing detail pages.

There is also a test-session path using localStorage and Convex test users. That should be treated as development-only.

### Main user journeys

The core journeys are:

1. **Guest browsing**

   * Landing page.
   * Public rent/search page.
   * Public listing detail/gallery.
   * Prompted to sign in for protected actions.

2. **Renter journey**

   * WorkOS login/sign-up.
   * Onboarding.
   * Search listings.
   * Save favourites.
   * Request viewings.
   * Track viewings and messages/profile/settings.

3. **Broker/landlord journey**

   * WorkOS login/sign-up.
   * Broker onboarding.
   * Publish a listing via `/app/publish`.
   * View own listings via `/app/my-listings`.
   * Manage a listing via `/app/my-listings/:id`.
   * View leads via `/app/leads`.

4. **Company admin journey**

   * User with `company_admin` role is routed to `/app/admin`.
   * The admin panel currently looks like a high-fidelity prototype, but much of it appears hard-coded rather than backed by Convex.

### Core pages and flows

Current routing is hand-rolled in `src/App.jsx` and `src/lib/router.js`.

Public/auth pages:

* `src/pages/LandingPage.jsx`
* `src/pages/LoginPage.jsx`
* `src/pages/SignupPage.jsx`
* `src/pages/CallbackPage.jsx`
* `src/pages/ForgotPasswordPage.jsx`
* `src/pages/OnboardingPage.jsx`

App pages:

* `src/pages/app/RentPage.jsx`
* `src/pages/app/ListingDetailPage.jsx`
* `src/pages/app/PublishPage.jsx`
* `src/pages/app/PublisherOverviewPage.jsx`
* `src/pages/app/ManageListingPage.jsx`
* `src/pages/app/ViewingsPage.jsx`
* `src/pages/app/LeadsPage.jsx`
* `src/pages/app/MessagesPage.jsx`
* `src/pages/app/ProfilePage.jsx`
* `src/pages/app/SettingsPage.jsx`
* `src/pages/app/AdminPanelPage.jsx`

Large page files are doing too much. `RentPage.jsx`, `AdminPanelPage.jsx`, `OnboardingPage.jsx`, `ProfilePage.jsx`, `ListingDetailPage.jsx`, `LandingPage.jsx`, and `PublishPage.jsx` should be refactored gradually, not rewritten.

### Main Convex entities and functions

Current schema tables in `convex/schema.js`:

* `appMeta`
* `users`
* `listings`
* `favorites`
* `viewings`
* `leads`

Current Convex functions:

* `convex/users.js`

  * `me`
  * `getTestSession`
  * `createTestUser`
  * `upsertFromAuth`
  * `updateMe`
  * `switchActiveRole`
  * `updateTestUser`
  * `addRoleToTestUser`
  * `completeOnboarding`
  * `completeTestOnboarding`

* `convex/listings.js`

  * `list`
  * `get`
  * `create`
  * `update`
  * `remove`
  * `publish`
  * `requestVerification`

* `convex/favorites.js`

  * `list`
  * `add`
  * `remove`

* `convex/viewings.js`

  * `create`
  * `list`

* `convex/leads.js`

  * `list`
  * `update`

* `convex/ai.js`

  * `search`

* `convex/setup.js`

  * `ensureSeeded`

Implemented Phase 1 auth safety changes:

* New WorkOS users are created as `renter`.
* `upsertFromAuth` ignores client-supplied role fields.
* `updateMe` no longer accepts or patches `role`/`roles`.
* `switchActiveRole` only switches to an already granted role.
* Public `addRoleToMe` has been removed in favour of an internal role grant helper.
* Broker/company-admin onboarding records a pending role request instead of granting access.
* Test-session functions require `ENABLE_TEST_AUTH=true`.
* `sanitizeUser` strips `testSessionToken`.
* `setup.ensureSeeded` requires `ENABLE_SEED_DATA=true`, and normal client boot no longer calls it.

Remaining backend hardening is mostly around broad validators, listing status transitions, bounded listing reads, media storage, and organisation/member semantics.

### Auth boundaries

WorkOS AuthKit is wired in `src/main.jsx` with `AuthKitProvider` and `ConvexProviderWithAuthKit`.

Auth-related files:

* `src/main.jsx`
* `src/lib/convex.js`
* `src/pages/LoginPage.jsx`
* `src/pages/SignupPage.jsx`
* `src/pages/CallbackPage.jsx`
* `convex/auth.config.js`
* `convex/users.js`

Current frontend route protection happens mostly in `src/App.jsx`. Convex also checks some role permissions, but not strictly enough.

Important current boundary:

* Public:

  * `/`
  * `/app/rent`
  * `/app/listings/:id`
  * `/app/listings/:id/gallery`
  * `/login`
  * `/signup`
  * `/forgot-password`
  * `/callback`

* Authenticated:

  * `/onboarding`
  * `/app/profile`
  * `/app/settings`
  * `/app/messages`
  * role-specific app routes under `/app`.

The frontend route guard is useful, but it must not be treated as a permission system. Convex must enforce all sensitive permissions server-side.

### Obvious production-readiness gaps

The main gaps are:

* Client-side role escalation has been blocked server-side.
* Test-user and test-session paths still exist for development, but are gated behind `ENABLE_TEST_AUTH=true`.
* Public seeding still exists as a mutation, but is gated behind `ENABLE_SEED_DATA=true` and is no longer called from normal client boot.
* Several Convex functions accept `v.any()` payloads.
* Listing status and moderation are not strongly controlled server-side.
* Listing queries use unbounded `.collect()` in several places.
* Images are stored as listing document strings/data URLs rather than proper file storage.
* Large page components are hard to maintain safely.
* Admin/messages areas contain prototype/demo data.
* The fake password reset page does not integrate with WorkOS.
* There is no test, lint, or typecheck script.
* Environment fallbacks can hide missing production configuration.

## 2. Preserve list

### UI patterns worth keeping

Preserve:

* The overall visual language: rounded cards, white surfaces, restrained dark navy primary colour, soft borders, polished listing cards.
* `AppShell` layout pattern for app routes.
* `MarketingHeader` and landing page visual direction.
* Listing cards and visual cards, especially:

  * `ListingVisualCard`
  * `MapListingPreviewCard`
  * `ListingPreview`
* The detail page layout concept: gallery, map context, amenities, CTA areas.
* The publish flow concept: guided listing creation with quality/completeness feedback.
* The renter search experience, including quick filters and AI-guided search UI.
* Toast notifications via `ToastStack`.
* The current Tailwind token direction in `tailwind.config.js` and shared component classes in `src/index.css`.

### Components already good enough to keep

Good candidates to keep and improve in place:

* `src/components/layout/AppShell.jsx`
* `src/components/layout/MarketingHeader.jsx`
* `src/components/layout/Breadcrumbs.jsx`
* `src/components/layout/ToastStack.jsx`
* `src/components/app/ListingVisualCard.jsx`
* `src/components/app/ListingPreview.jsx`
* `src/components/app/MapListingPreviewCard.jsx`
* `src/components/app/ViewingRequestModal.jsx`
* `src/components/app/FieldLabel.jsx`
* `src/components/app/FurnishingToggle.jsx`
* `src/components/app/PresetTextField.jsx`
* `src/components/app/SavedSearchesPanel.jsx`
* `src/components/icons/Icon.jsx`
* `src/lib/navbarRoles.js`, after tightening role semantics.

Some of these need accessibility and typing improvements, but the basic product surface is usable.

### Product flows that should remain unchanged

Preserve the existing user-facing flows:

* Public browse before login.
* Search-first renter journey.
* Listing detail as the central conversion page.
* Favourites for authenticated renters.
* Viewing/enquiry request flow.
* Broker listing creation and publish flow.
* Broker lead pipeline.
* Company admin dashboard route, but label its current implementation internally as prototype/demo until backed by real data.
* Role-aware navigation and route defaults.

### Stack decisions that should remain unchanged

Keep:

* Vite.
* React.
* Tailwind CSS.
* Convex.
* WorkOS AuthKit.
* Vercel-style SPA deployment assumptions.
* PostHog only if it is deliberately part of the product analytics plan.

Do not introduce Next.js, Remix, Redux, tRPC, a separate backend, or a new auth system. None is justified by the current codebase.

### Data model choices that seem reasonable

Keep the basic separation of:

* Users.
* Listings.
* Favourites.
* Viewings/enquiries.
* Leads.

Reasonable current choices:

* Public listing IDs for URLs.
* Owner relationship on listings.
* Separate favourites table.
* Separate viewings and leads, although the relationship should be made stricter.
* Draft/published concept for listings, though the status model needs hardening.
* Storing source metadata for imported/scraped listings, though it should be formalised.

## 3. Problem list

### Critical

| Problem                                                 | Where                                                                                                                           |                                                                                                                                      Why it matters | Fix now or later                                           | Lowest-risk fix                                                                                                                                                                                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------: | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Users can elevate their own roles                       | `convex/users.js`, especially previous `updateMe`, `addRoleToMe`, `completeOnboarding`; frontend calls in `src/state/AppState.jsx` | Any authenticated user could become `broker` or `company_admin` by sending role/roles payloads. Frontend route guards do not protect Convex data. | Done in Phase 1 auth safety                               | `updateMe` accepts safe profile fields only. `switchActiveRole` only switches to granted roles. Public `addRoleToMe` was removed. `completeOnboarding` records pending elevated-role requests without granting them. Internal role grant remains for future admin/invite flows. |
| Public test auth/session functions                      | `convex/users.js`, `src/state/AppState.jsx`, `src/pages/SignupPage.jsx`                                                         | Test sessions and localStorage auth bypasses are useful for development but unsafe in production.                                                   | Done for production gating; later remove if not needed     | Test functions require `ENABLE_TEST_AUTH=true`. `sanitizeUser` strips `testSessionToken`. Test-token lookup now uses `by_test_session_token`.                                                                                                    |
| Public seeding mutation called by clients               | `convex/setup.js`, previous `src/state/AppState.jsx` boot path                                                                  | Any client could trigger seed logic. Production data setup should not be a normal app action.                                                        | Done for production gating; refine deployment process later | `setup.ensureSeeded` requires `ENABLE_SEED_DATA=true`. Normal client bootstrap no longer calls seeding. Deployment docs still need a manual seed/import process.                                                                                  |
| Listing status can be influenced through broad payloads | `convex/listings.js`, `buildListingPayload`                                                                                     |                                       `payload.status` is accepted during create/update. Owners can bypass intended publish/moderation transitions. | Now                                                        | Remove `status` from general listing payload updates. Add explicit mutations for `requestPublish`, `publish`, `pause`, `archive`, and moderation decisions. Validate allowed transitions.                                                         |
| Broad `v.any()` validators                              | `convex/schema.js`, `convex/users.js`, `convex/listings.js`, `convex/leads.js`, `convex/ai.js`                                  |                                   Data shape is not enforced. Bad or malicious payloads can corrupt documents or create incompatible client states. | Now                                                        | Replace `v.any()` on sensitive mutations with explicit object validators. Start with users, listings, leads, viewings. Leave loose import metadata only where justified.                                                                          |
| Unbounded backend reads                                 | `convex/lib.js` `listVisibleListings`, `convex/ai.js`, `convex/listings.js` duplicate checks                                    |                                                            `.collect()` over whole tables will not scale and can become slow or fail as data grows. | Now for listings, later for secondary prototype areas      | Test-session lookup is now indexed. Add indexed/paginated listing queries next. Use `by_status`, `by_owner_id`, search indexes where appropriate, and bounded duplicate checks.                                                                  |
| Images stored inside listing documents                  | `src/pages/app/PublishPage.jsx`, `convex/schema.js` `listings.images`                                                           |                                    Base64/data URLs can bloat Convex documents and hit size limits. Media should not live inside listing documents. | Before real listing uploads                                | Use Convex storage or external asset URLs. Store media metadata in `listingMedia` or as small references only. Migrate current demo images gradually.                                                                                             |
| Fake password reset flow                                | `src/pages/ForgotPasswordPage.jsx`                                                                                              |                                           The UI claims to send reset links but only sets local state. This is misleading and can block real users. | Before production                                          | Replace with WorkOS-supported password reset flow or remove the page and route users through WorkOS AuthKit’s own account recovery.                                                                                                               |

### Important

| Problem                                                  | Where                                                                                                                                                                                                               |                                                                                                                                                  Why it matters | Fix now or later                | Lowest-risk fix                                                                                                               |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------: | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Very large page components                               | `RentPage.jsx`, `AdminPanelPage.jsx`, `OnboardingPage.jsx`, `ProfilePage.jsx`, `ListingDetailPage.jsx`, `LandingPage.jsx`, `PublishPage.jsx`                                                                        |                                     Hard to review, test, and modify safely. Bugs will accumulate because UI, state, data access, and business rules are mixed. | Start now, incremental          | Extract stable presentational components first. Do not rewrite routes. Keep visual output unchanged.                          |
| Backend imports frontend modules                         | `convex/lib.js` imports from `src/data` and `src/lib`                                                                                                                                                               |                                               Convex backend depends on frontend file layout and may accidentally pull browser/UI assumptions into server code. | Now                             | Move shared pure logic and seed data into `shared/` or `convex/shared/`. Keep React/browser code out of Convex imports.       |
| Role naming inconsistency                                | `publisher` appears in seed data, old components, `MyListingsPage.jsx`, `AuthOverlay.jsx`, router helpers                                                                                                           | Confusing permissions and route behaviour. `MyListingsPage.jsx` still checks `user?.role !== "publisher"`, which conflicts with current `broker` normalisation. | Now, but carefully              | Standardise app roles as `renter`, `broker`, `company_admin`. Keep `publisher` only as a migration alias in one role utility. |
| Dead or legacy code likely present                       | `src/api/mockServer.js`, `src/pages/app/MyListingsPage.jsx`, `src/components/BuyerWorkspace.jsx`, `SellerWorkspace.jsx`, `BookingSheet.jsx`, `ListingCard.jsx`, `ListingModal.jsx`, `TopBar.jsx`, `AuthOverlay.jsx` |                                                      Increases maintenance cost and confuses future changes. Some legacy code still references old role models. | Later in Phase 2                | Confirm no imports and no product dependency. Move to `legacy/` or delete in a dedicated cleanup commit after approval.       |
| Imperative global data orchestration                     | `src/state/AppState.jsx`, `src/api/*`                                                                                                                                                                               |                                  The app manually refreshes everything after mutations and loses some Convex subscription benefits. It is workable but fragile. | Later, after backend hardening  | Introduce feature hooks around Convex queries/mutations. Do not rewrite all state at once.                                    |
| Local-only saved filters/searches                        | `src/state/AppState.jsx` localStorage keys                                                                                                                                                                          |                                                                                                   Good for prototype, but not cross-device and not recoverable. | Later                           | Keep localStorage for now. Add Convex `savedSearches` only after core auth/data issues are fixed.                             |
| Admin panel is mostly demo data                          | `src/pages/app/AdminPanelPage.jsx`                                                                                                                                                                                  |                                                             It looks production-like but does not appear to enforce real organisation/member/listing semantics. | Before real admin users         | Either clearly mark as demo/internal, or connect to real Convex organisation/listing/member data.                             |
| Messages page appears prototype/static                   | `src/pages/app/MessagesPage.jsx`                                                                                                                                                                                    |                                                                                                                                Users may expect real messaging. | Later unless launching messages | Either scope as UI prototype or connect to a real conversations/messages model.                                               |
| Duplicate role/routing logic                             | `src/App.jsx`, `src/lib/router.js`, `src/lib/navbarRoles.js`, `ProfileMenuDropdown.jsx`, `MarketingHeader.jsx`                                                                                                      |                                                                                         Permission behaviour can diverge between route guards, nav, and server. | Now                             | Centralise role helpers in one shared module and reuse everywhere. Server remains the authority.                              |
| Validation mostly lives in forms                         | `PublishPage.jsx`, `ViewingRequestModal.jsx`, onboarding/profile forms                                                                                                                                              |                                                                                                Client validation improves UX but cannot protect data integrity. | Now for sensitive mutations     | Add server validators first. Then share frontend constants/rules where useful.                                                |
| Error handling is inconsistent                           | `AppState.jsx`, page-level catches, publish/listing flows                                                                                                                                                           |                                                                           Some errors are swallowed, others become toasts. Users can get blank or stale states. | Phase 2 to 4                    | Add common `LoadingState`, `ErrorState`, `EmptyState`, and route-level fallback patterns.                                     |
| Environment fallbacks can hide misconfiguration          | `src/lib/convex.js`, `src/main.jsx`                                                                                                                                                                                 |                                                `placeholder.convex.cloud` and `client_placeholder` are acceptable for local guardrails but risky in production. | Before deployment               | Fail loudly in production when required env vars are absent. Keep local explanatory UI only in dev.                           |
| No formal tests, lint or typecheck scripts               | `package.json`                                                                                                                                                                                                      |                                                                                                       Refactoring will be high-risk without automated feedback. | Start Phase 1                   | Add minimal scripts and smoke tests. Do not attempt comprehensive coverage immediately.                                       |
| Google Maps API key handling is partly embedded in pages | `LandingPage.jsx`, `RentPage.jsx`, `ListingDetailPage.jsx`                                                                                                                                                          |                                                             Three separate script loaders and map fallbacks create duplication and inconsistent error handling. | Later                           | Extract a shared Google Maps loader and shared map fallback component.                                                        |
| Analytics is initialised globally                        | `src/lib/analytics.js`, `src/main.jsx`                                                                                                                                                                              |                                                                               This may be fine, but production should define consent and environment behaviour. | Before deployment               | Decide analytics policy. Disable by default without `VITE_PUBLIC_POSTHOG_KEY`.                                                |

### Nice to have

| Problem                                  | Where                                                               |                                                 Why it matters | Fix now or later | Lowest-risk fix                                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------: | ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| File organisation is flat and page-heavy | `src/pages`, `src/components`                                       |                           Harder to see ownership of features. | Later            | Move only when extracting real feature boundaries. Avoid aesthetic-only moves.                                         |
| Mixed JavaScript and one TypeScript file | `src/lib/iconSystem.ts`                                             |                     Type safety is not consistently available. | Later            | Gradually add TypeScript to new shared modules and Convex-facing types. Do not convert all pages at once.              |
| Some stale naming/comments               | `src/index.css` mentions Clerk, legacy AuthOverlay/publisher naming |                             Confusing but not dangerous alone. | Later            | Clean during adjacent work.                                                                                            |
| Asset duplication and large images       | `Assets/`, `public/object-images`, page imports                     |                    Bundle size and asset management can drift. | Later            | Inventory assets, standardise public paths, compress images.                                                           |
| Accessibility polish needed              | Modals, cards, filters, maps, forms                                 |           Important for production quality and keyboard users. | Phase 4          | Add focus management, labels, aria descriptions, keyboard handling, and reduced-motion checks without visual redesign. |
| SEO basics are limited by SPA setup      | `index.html`, public listing pages                                  | Public classifieds benefit from title/meta and share previews. | Phase 4/5        | Add route-level document title/meta helpers. Consider prerendering later only if needed.                               |

## 4. Proposed target architecture

Keep the app small and direct. The target is clearer boundaries, not enterprise architecture.

### Proposed folder structure

A suitable structure:

```text
src/
  app/
    App.jsx
    AppProviders.jsx
    routeConfig.js
    routeGuards.js

  shared/
    ui/
      Button.jsx
      Modal.jsx
      Field.jsx
      LoadingState.jsx
      ErrorState.jsx
      EmptyState.jsx
      ToastStack.jsx
    layout/
      AppShell.jsx
      MarketingHeader.jsx
      AppFooter.jsx
      Breadcrumbs.jsx
    lib/
      env.js
      router.js
      roles.js
      formatters.js
      analytics.js
      googleMaps.js
    data/
      listingConstants.js

  features/
    auth/
      pages/
        LoginPage.jsx
        SignupPage.jsx
        CallbackPage.jsx
        ForgotPasswordPage.jsx
      useSessionSync.js

    onboarding/
      pages/
        OnboardingPage.jsx
      components/

    listings/
      pages/
        RentPage.jsx
        ListingDetailPage.jsx
        PublishPage.jsx
        PublisherOverviewPage.jsx
        ManageListingPage.jsx
      components/
        ListingVisualCard.jsx
        ListingPreview.jsx
        ListingGallery.jsx
        MapListingPreviewCard.jsx
        ListingForm.jsx
      hooks/
        useListings.js
        useListingActions.js
      listingValidation.js

    enquiries/
      pages/
        ViewingsPage.jsx
        LeadsPage.jsx
        MessagesPage.jsx
      components/
        ViewingRequestModal.jsx
        LeadStatusBadge.jsx

    profile/
      pages/
        ProfilePage.jsx
        SettingsPage.jsx

    admin/
      pages/
        AdminPanelPage.jsx
      demoData.js

  api/
    client.js
    convexRefs.js
    services/
      users.js
      listings.js
      favourites.js
      enquiries.js
      leads.js

convex/
  schema.js
  users.js
  listings.js
  favourites.js
  enquiries.js
  leads.js
  organisations.js
  openimmo.js
  seed.js
  lib/
    auth.js
    validators.js
    listingMapping.js
    pagination.js
```

This is a target direction, not a first commit. The first steps should extract shared logic while leaving routes and imports mostly intact.

### Mapping current files to target structure

| Current file                                 | Target                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/App.jsx`                                | `src/app/App.jsx` plus `routeConfig.js` and `routeGuards.js`                                     |
| `src/main.jsx`                               | `src/app/AppProviders.jsx` plus `main.jsx` bootstrap                                             |
| `src/state/AppState.jsx`                     | Split gradually into `auth/useSessionSync`, listing hooks, enquiry hooks, and shared toast state |
| `src/lib/router.js`                          | `src/shared/lib/router.js`                                                                       |
| `src/lib/navbarRoles.js`                     | `src/shared/lib/roles.js`                                                                        |
| `src/lib/convex.js`                          | `src/api/convexRefs.js` or `src/shared/lib/convexClient.js`                                      |
| `src/components/layout/*`                    | `src/shared/layout/*`                                                                            |
| `src/components/app/Listing*`                | `src/features/listings/components/*`                                                             |
| `src/components/app/ViewingRequestModal.jsx` | `src/features/enquiries/components/ViewingRequestModal.jsx`                                      |
| `src/pages/app/RentPage.jsx`                 | `src/features/listings/pages/RentPage.jsx`                                                       |
| `src/pages/app/PublishPage.jsx`              | `src/features/listings/pages/PublishPage.jsx`                                                    |
| `src/pages/app/LeadsPage.jsx`                | `src/features/enquiries/pages/LeadsPage.jsx`                                                     |
| `src/pages/app/ViewingsPage.jsx`             | `src/features/enquiries/pages/ViewingsPage.jsx`                                                  |
| `src/pages/app/AdminPanelPage.jsx`           | `src/features/admin/pages/AdminPanelPage.jsx`, with demo data separated                          |
| `convex/lib.js` shared imports from `src`    | Move shared pure code into Convex-safe modules                                                   |

### Page/routing structure

Keep the hand-rolled router initially. React Router is not necessary just to professionalise this app.

Improve by introducing:

* A central route config with:

  * path pattern
  * component
  * public/authenticated requirement
  * allowed roles
  * default redirect
* A single `canAccessRoute(user, pathname)` helper.
* A single role normalisation helper.

This reduces the complexity currently concentrated in `src/App.jsx`.

### Shared UI components

Introduce shared UI only where duplication already exists:

* `Button`
* `Modal`
* `Field`
* `SelectField`
* `TextareaField`
* `Badge`
* `StatusBadge`
* `LoadingState`
* `ErrorState`
* `EmptyState`
* `ConfirmDialog`

Do not wrap every Tailwind class into components. That would add ceremony without solving the real issues.

### Feature-level modules

Use feature modules for logic-heavy areas:

* `auth`
* `onboarding`
* `listings`
* `search`
* `enquiries`
* `profile`
* `admin`

Each feature should own:

* pages
* feature-specific components
* feature hooks
* frontend validation helpers
* mapping helpers if they are purely client-side.

### Convex schema and functions

Convex should become the source of truth for:

* permissions
* ownership
* listing status transitions
* validation
* data relationships.

Use explicit validators in every public query/mutation. Keep `internalMutation` or `internalQuery` for seed/import/admin-only maintenance tasks.

### Auth integration boundaries

Frontend:

* WorkOS AuthKit handles sign-in, sign-up, sign-out, redirects.
* React reads WorkOS state and syncs with Convex user state.
* Frontend route guards improve UX but do not enforce permissions.

Backend:

* Convex reads `ctx.auth.getUserIdentity()`.
* Convex maps `identity.tokenIdentifier` to an internal user.
* Convex checks role and ownership before every sensitive operation.
* Convex ignores any client-supplied user ID for permission decisions.
* Current implementation also ignores client-supplied role grants during auth sync/profile updates; elevated access is request-only until an internal admin/invite flow grants it.

### Data fetching conventions

Short term:

* Keep the existing service wrapper.
* Move data fetching out of page components into feature hooks.
* Keep `AppState` while reducing its responsibilities.

Medium term:

* Use Convex `useQuery` and `useMutation` where reactive data is useful.
* Keep imperative calls for form submissions and one-off actions.
* Prefer paginated listing queries over loading all listings into one global state.

### Form and validation conventions

Use a three-layer model:

1. HTML/browser constraints for simple UX.
2. Frontend validation helpers for friendly messages.
3. Convex validators and server-side rules as the real enforcement layer.

No sensitive mutation should accept untyped `payload: v.any()`.

### Error/loading/empty state conventions

Add standard states:

* Page-level loading for initial route data.
* Section-level loading for cards/tables.
* Empty states with a clear next action.
* Error states with retry where safe.
* Toasts for action results, not for every data-load failure.
* Form inline errors for validation failures.

### Environment configuration

Create a single frontend env helper:

* `requireClientEnv(name)` for production-required vars.
* `optionalClientEnv(name)` for optional integrations.
* Explicit production failure if required values are missing.

Required frontend vars:

* `VITE_CONVEX_URL`
* `VITE_WORKOS_CLIENT_ID`
* `VITE_WORKOS_REDIRECT_URI`

Likely optional:

* `VITE_GOOGLE_MAPS_API_KEY`
* `VITE_PUBLIC_POSTHOG_KEY`
* `VITE_PUBLIC_POSTHOG_HOST`

Backend Convex env:

* `WORKOS_CLIENT_ID`
* any future import/monitoring secrets.

### Type safety approach

Do not convert the whole app to TypeScript in one pass.

Recommended approach:

1. Tighten Convex validators first.
2. Generate/use Convex function and data model types.
3. Add TypeScript to shared modules and API/service wrappers.
4. Convert extracted new components/hooks opportunistically.
5. Leave large existing JSX pages as JSX until they have been broken down.

## 5. Data model and backend plan

The current schema is not fundamentally wrong. It needs stronger types, ownership, status rules, and OpenImmo-aligned fields.

Based on the supplied OpenImmo 1.2.7 XML sample, relevant OpenImmo sections include:

* `anbieter`
* `kontaktperson`
* `objektkategorie`
* `geo`
* `preise`
* `flaechen`
* `ausstattung`
* `zustand_angaben`
* `freitexte`
* `anhaenge`
* `verwaltung_objekt`
* `verwaltung_techn`

The app should not expose OpenImmo complexity directly to users. Keep the current UI-friendly listing fields and map them to a structured OpenImmo-compatible source model.

### Proposed core schema

#### `users`

Purpose: identity, profile, role membership.

Fields:

* `publicId`
* `tokenIdentifier`
* `email`
* `name`
* `phone`
* `roles: ("renter" | "broker" | "company_admin")[]`
* `activeRole`
* `onboardingCompleted`
* `profile`
* `organisationId?`
* `authProvider`
* `createdAt`
* `updatedAt`

Remove production dependency on:

* `testSessionToken`
* self-controlled `role` grants.

Current implementation note:

* `role` is still the active-role field in the existing schema.
* `roles` remains granted role membership.
* `publisher` is still accepted as a legacy alias and normalised to `broker`.
* Test sessions remain in schema for development only and are gated by `ENABLE_TEST_AUTH=true`.

Indexes:

* `by_token_identifier`
* `by_email`
* `by_public_id`
* `by_organisation_id`

#### `organisations`

Purpose: landlords, brokerages, property companies.

Fields:

* `publicId`
* `name`
* `legalName`
* `organisationNumber`
* `type: "landlord" | "brokerage" | "property_company"`
* `website`
* `contactEmail`
* `verificationStatus: "unverified" | "pending" | "verified" | "rejected"`
* `createdByUserId`
* `createdAt`
* `updatedAt`

Indexes:

* `by_public_id`
* `by_created_by`
* `by_verification_status`
* `by_organisation_number`

#### `organisationMembers`

Purpose: membership and permissions inside organisations.

Fields:

* `organisationId`
* `userId`
* `role: "owner" | "admin" | "broker"`
* `status: "invited" | "active" | "removed"`
* `invitedEmail?`
* `createdAt`
* `updatedAt`

Indexes:

* `by_user_id`
* `by_organisation_id`
* `by_org_user`
* `by_status`

#### `listings`

Purpose: canonical listing document optimised for app reads.

Fields:

* `publicId`
* `slug?`
* `ownerUserId`
* `organisationId?`
* `title`
* `description`
* `shortDescription?`
* `propertyType`
* `marketingType`, likely `"rent"` for now
* `status: "draft" | "pending_review" | "published" | "paused" | "archived" | "rejected"`
* `moderationStatus: "not_requested" | "requested" | "approved" | "rejected"`
* `verified`
* `qualityScore`
* `location`

  * `address`
  * `street`
  * `houseNumber`
  * `postcode`
  * `city`
  * `district`
  * `county`
  * `country`
  * `lat`
  * `lng`
  * `floor`
* `pricing`

  * `currency`
  * `rentMonthly`
  * `rentNet`
  * `rentGross`
  * `operatingCosts`
  * `pricePerSqm`
  * `vatIncluded`
  * `deposit`
* `areas`

  * `officeAreaSqm`
  * `totalAreaSqm`
  * `usableAreaSqm`
  * `storageAreaSqm`
  * `retailAreaSqm`
* `availability`

  * `availableFrom`
  * `label`
  * `minTermMonths`
  * `maxTermMonths`
* `capacity`
* `amenities`
* `tags`
* `source`

  * `type: "manual" | "scraped" | "openimmo"`
  * `url?`
  * `importId?`
  * `externalId?`
* `openImmo`

  * `version`
  * `providerNumber`
  * `openimmoObjectId`
  * `objectNumberInternal`
  * `objectNumberExternal`
  * `rawCategory`
  * `rawAction`
  * `lastImportedAt`
* `createdAt`
* `updatedAt`
* `publishedAt?`
* `archivedAt?`

Keep current top-level fields temporarily for low-risk migration:

* `title`
* `district`
* `county`
* `address`
* `type`
* `priceMonthly`
* `sizeSqm`
* `capacity`
* `availability`
* `term`
* `responseHours`
* `verified`
* `image`
* `images`
* `amenities`
* `tags`
* `ownerId`
* `status`

But treat those as compatibility fields during migration. Do not force the UI to consume the full OpenImmo structure immediately.

Indexes:

* `by_public_id`
* `by_status`
* `by_owner_user_id`
* `by_organisation_id`
* `by_status_updated_at`
* `by_owner_status`
* `by_organisation_status`
* `by_district_status`
* `by_property_type_status`
* `by_source_external_id`
* optional search index on title, address, district, description.

#### `listingMedia`

Purpose: listing images/files without bloating listing documents.

Fields:

* `listingId`
* `storageId?`
* `url?`
* `type: "image" | "floorplan" | "document" | "tour"`
* `title`
* `alt`
* `sortOrder`
* `source`
* `createdAt`

Indexes:

* `by_listing_id`
* `by_listing_sort_order`

#### `enquiries`

Unify or gradually replace `viewings` and `leads` with a single source of truth.

Fields:

* `publicId`
* `listingId`
* `renterUserId`
* `ownerUserId`
* `organisationId?`
* `preferredSlots`
* `message`
* `budget`
* `teamSize`
* `status: "new" | "contacted" | "viewing_scheduled" | "qualified" | "declined" | "closed"`
* `fitScore`
* `tags`
* `notes`
* `createdAt`
* `updatedAt`

Indexes:

* `by_renter_user_id`
* `by_owner_user_id`
* `by_organisation_id`
* `by_listing_id`
* `by_status`
* `by_listing_renter`
* `by_owner_status`

If keeping `viewings` and `leads` short term, enforce one viewing/lead pair per listing/renter and make lead creation an internal helper.

#### `favourites`

Fields:

* `userId`
* `listingId`
* `createdAt`

Indexes:

* `by_user_id`
* `by_listing_id`
* `by_user_listing`

#### `savedSearches`

Optional, later.

Fields:

* `userId`
* `name`
* `filters`
* `createdAt`
* `updatedAt`

Indexes:

* `by_user_id`

### OpenImmo mapping

Map the current UI fields to OpenImmo-compatible sections:

| App field                                     | OpenImmo source                                                               |
| --------------------------------------------- | ----------------------------------------------------------------------------- |
| `title`                                       | `freitexte.objekttitel`                                                       |
| `description`                                 | `freitexte.objektbeschreibung`, `freitexte.objekt_text`                       |
| `type` / `propertyType`                       | `objektkategorie.objektart`, `objektart_zusatz`                               |
| `marketingType`                               | `objektkategorie.vermarktungsart`                                             |
| `address`, `district`, `county`, `lat`, `lng` | `geo`                                                                         |
| `priceMonthly`                                | `preise.kaltmiete`, `nettokaltmiete`, or `warmmiete` depending source quality |
| `pricePerSqm`                                 | `preise.mietpreis_pro_qm`                                                     |
| `sizeSqm`                                     | `flaechen.bueroflaeche`, falling back to `gesamtflaeche` or `nutzflaeche`     |
| `capacity`                                    | App-specific; can map from `verwaltung_objekt.max_personen` where provided    |
| `availability`                                | `verwaltung_objekt.verfuegbar_ab`, `abdatum`, `bisdatum`                      |
| `term`                                        | `verwaltung_objekt.min_mietdauer`, `max_mietdauer`, `laufzeit`                |
| `amenities`                                   | `ausstattung`                                                                 |
| `images` / media                              | `anhaenge.anhang`                                                             |
| external object id                            | `verwaltung_techn.openimmo_obid`, `objektnr_extern`                           |
| source action                                 | `verwaltung_techn.aktion`                                                     |

Do not store full raw XML inside listing documents. If preserving raw source is needed, store it in Convex storage or an `imports` table and keep a small reference on the listing.

### Queries

Public/listing queries:

* `listings.searchPublic`

  * public
  * returns only `published` listings
  * paginated
  * supports district/type/size/budget/team filters
* `listings.getPublic`

  * public
  * only `published`, unless viewer owns it
* `listings.listMine`

  * authenticated broker/company admin
  * owner or organisation listings
* `listings.getMine`

  * authenticated owner/admin
* `favourites.listMine`

  * authenticated renter
* `enquiries.listMineAsRenter`

  * authenticated renter
* `enquiries.listMineAsOwner`

  * authenticated broker/company admin
* `organisations.getMine`

  * authenticated user.

### Mutations

* `users.updateProfile`
* `users.completeOnboarding`
* `users.switchActiveRole`
* `listings.createDraft`
* `listings.updateDraft`
* `listings.requestPublish`
* `listings.publish`, owner or admin depending moderation policy
* `listings.pause`
* `listings.archive`
* `favourites.add`
* `favourites.remove`
* `enquiries.create`
* `enquiries.updateStatus`
* `organisations.create`
* `organisations.inviteMember`
* `organisations.updateMemberRole`

### Internal functions

* `seed.initialData`
* `openimmo.importListing`
* `openimmo.mapListing`
* `listings.recalculateQualityScore`
* `enquiries.createLeadFromViewing` if viewings/leads remain split
* `moderation.approveListing`
* `moderation.rejectListing`
* `cleanup.removeListingReferences`

### Auth checks

Every sensitive mutation should derive the user from `ctx.auth.getUserIdentity()`.

Rules:

* Public users can read only published listings.
* Renter can favourite published listings.
* Renter can create an enquiry for a published listing.
* Renter cannot enquire on their own listing.
* Broker can create listings only if their user has a granted broker/company admin role.
* Broker can update only own listings or listings belonging to their organisation.
* Company admin can manage organisation listings and members.
* Status transitions must be explicit and validated.
* No client-supplied `ownerId`, `publisherId`, `renterId`, or `organisationId` should be trusted without server-side membership checks.

### Server-side validation rules

Minimum rules:

* String lengths for title, description, address, phone, names.
* Numeric bounds for rent, size, capacity, response hours.
* Enumerated values for role, status, property type, lead/enquiry status.
* Date strings validated for ISO/date-like format where used.
* Image/media references validated as storage IDs or safe URLs.
* Amenities/tags normalised and length-limited.
* `sourceUrl` and external source IDs sanitised and length-limited.
* Profile objects broken into typed role-specific subobjects over time.

### Listing status and moderation

Recommended status model:

* `draft`: visible only to owner/admin.
* `pending_review`: submitted for moderation.
* `published`: public.
* `paused`: owner/admin hidden without deletion.
* `rejected`: moderation rejected.
* `archived`: no longer active, retained for history.

Current `active` can remain as a compatibility alias during migration, but new code should use `published`.

## 6. Auth and permissions plan

### Authenticated vs unauthenticated routes

Unauthenticated allowed:

* `/`
* `/app/rent`
* `/app/listings/:id`
* `/app/listings/:id/gallery`
* `/login`
* `/signup`
* `/callback`

Authenticated any-role:

* `/onboarding`
* `/app/profile`
* `/app/settings`
* `/app/messages`, if messages remain enabled.

Renter:

* `/app/rent`
* `/app/viewings`
* favourites and enquiry actions.

Broker:

* `/app/my-listings`
* `/app/my-listings/:id`
* `/app/publish`
* `/app/leads`

Company admin:

* `/app/admin`
* broker routes for their organisation.

### Required roles or permission levels

Use app roles:

* `renter`
* `broker`
* `company_admin`

Use organisation-level roles separately:

* `owner`
* `admin`
* `broker`

Avoid using app roles to express organisation membership. A user can be a `broker` but only manage listings for organisations where they are an active member.

### How the app should identify listing owners

Backend-owned fields only:

* `ownerUserId`, derived from authenticated viewer.
* `organisationId`, derived from active organisation membership.
* never from client payload.

Frontend can display ownership state, but cannot decide it.

### How Convex should enforce auth server-side

Create shared Convex helpers:

* `getViewerOrThrow(ctx)`
* `requireRole(ctx, role)`
* `requireListingOwner(ctx, listingId)`
* `requireOrganisationMember(ctx, organisationId, allowedRoles)`
* `canManageListing(ctx, listing)`

Use those helpers in every mutation and non-public query.

### First-time users

Flow:

1. WorkOS signs user in.
2. Convex `upsertFromAuth` creates/fetches user by `tokenIdentifier`.
3. New user receives default role `renter`.
4. `onboardingCompleted` is false.
5. User completes onboarding.
6. If user wants broker/company access, create a broker request or organisation invite flow. Do not grant elevated roles purely because the client submitted them.

### Sign-in, sign-out, redirects

Keep the current AuthKit flow, but tighten:

* Validate `returnTo` paths as local relative paths only.
* Do not redirect an authenticated user to admin unless server-granted `company_admin`.
* Use a single `getDefaultAppPath(user)` helper.
* Sign-out should clear local app state and test-session state only in dev.
* Callback page should handle pending auth sync and failure states explicitly.

### Protected actions

The frontend should prompt sign-in for:

* saving favourites
* requesting viewings/enquiries
* publishing listings
* opening protected app pages.

But Convex must still reject unauthorised calls.

## 7. Front-end refactor plan

### Component extraction priorities

Start with components that can be extracted without changing behaviour:

1. **Listing cards and listing metadata**

   * Consolidate duplicate listing card/header/stat patterns.
   * Keep existing `ListingVisualCard`, `ListingPreview`, `MapListingPreviewCard`.

2. **Search/filter UI from `RentPage.jsx`**

   * Extract filter panel.
   * Extract result list.
   * Extract map panel.
   * Extract selected listing drawer/card.
   * Keep the page as the orchestrator.

3. **Listing detail sections**

   * Gallery.
   * Key facts.
   * Amenities.
   * Location/map section.
   * Enquiry CTA.

4. **Publish form**

   * Listing basics section.
   * Location section.
   * Pricing/area section.
   * Amenities/media section.
   * Review/publish section.

5. **Onboarding**

   * Role selection.
   * Renter profile form.
   * Broker profile form.
   * Company admin form.

6. **Admin panel**

   * First split static data from UI.
   * Then connect sections to real data only if those features are in scope.

### What should remain page-specific

Keep page-specific:

* Route-level orchestration.
* Layout composition.
* High-level loading/error decisions.
* URL/path handling.
* Data hook calls.
* Page-specific copy.

Do not over-extract tiny one-off components.

### What should become shared

Shared:

* Buttons.
* Field wrappers.
* Modal shell.
* Empty/loading/error states.
* Status badges.
* Role labels.
* Currency/area/date formatting.
* Google Maps loader/fallback.
* Auth-required CTA wrapper.

### Reducing duplicated JSX

Use a practical rule: extract only repeated patterns that occur at least twice and have stable meaning.

Examples:

* Listing stat pills.
* Amenity chips.
* Role switch menu items.
* Form field rows.
* Page section cards.
* Modal shells.
* Empty table/list states.

### Feature-specific logic

Create feature hooks:

* `useListings(filters)`
* `useListing(id)`
* `useListingActions()`
* `useFavourites()`
* `useEnquiries()`
* `useLeads()`
* `useSessionSync()`

Do not hide all business logic in generic helpers. Keep domain-specific names.

### Forms

Short-term:

* Keep existing controlled forms.
* Move validation rules into named helpers.
* Convert submit handlers to call typed Convex service functions.
* Show inline validation errors.

Medium-term:

* Consider adding a form library only if forms remain painful after extraction. Do not add one now by default.

### API calls to Convex

Current `src/api` wrapper is acceptable as a bridge.

Improve it by:

* Moving function refs into feature-specific service files.
* Giving each service typed argument/return shapes.
* Removing public test functions from production paths.
* Avoiding global refresh after every mutation where only one feature needs refreshing.
* Gradually using `useQuery` for read-heavy pages.

### Loading, error and empty states

Add standard UX patterns:

* Search results loading skeleton or subdued spinner.
* Empty search state with “clear filters” action.
* Listing not found state.
* Publish save/publish progress state.
* Enquiry submission pending/error state.
* Leads empty state.
* Profile save success/error.
* Auth sync failure state on callback.

### Accessibility improvements

Do without changing design:

* Add modal focus trap and Escape close.
* Return focus to the triggering button after modal close.
* Use real buttons for clickable controls.
* Ensure listing cards that navigate are keyboard-accessible.
* Associate form labels and errors with inputs.
* Add `aria-live` for toasts or important async updates.
* Ensure images have meaningful alt text or empty alt if decorative.
* Keep reduced-motion support already present in CSS.
* Avoid colour-only status indications.

## 8. Production-readiness checklist

### Environment variables

* [ ] `VITE_CONVEX_URL` set for each environment.
* [ ] `VITE_WORKOS_CLIENT_ID` set.
* [ ] `VITE_WORKOS_REDIRECT_URI` set and matches WorkOS.
* [ ] `WORKOS_CLIENT_ID` set in Convex backend env.
* [ ] `VITE_GOOGLE_MAPS_API_KEY` set if map features are enabled.
* [ ] `VITE_PUBLIC_POSTHOG_KEY` set only if analytics is enabled.
* [ ] App fails loudly in production if required env vars are missing.
* [ ] Remove placeholder production fallbacks.

### Auth configuration

* [ ] WorkOS redirect URIs configured for local, preview, production.
* [ ] WorkOS CORS origins configured.
* [ ] Convex auth config verified against WorkOS issuer/JWKS.
* [ ] Callback route tested.
* [ ] Sign-out route tested.
* [ ] Password reset uses WorkOS or is removed.
* [x] Test auth disabled in production unless `ENABLE_TEST_AUTH=true`.

### Convex deployment

* [x] Public seeding removed from normal client boot.
* [x] Seed/import functions environment-gated with `ENABLE_SEED_DATA=true`.
* [ ] Required indexes added. `by_test_session_token` is done; listing/search indexes remain.
* [ ] Queries paginated where data can grow.
* [ ] No sensitive mutation uses `v.any()`.
* [ ] Generated Convex types committed/updated as expected.

### Error handling

* [ ] Route-level error state.
* [ ] Listing not found state.
* [ ] Auth sync failure state.
* [ ] Form submission errors shown inline.
* [ ] Network/Convex errors surfaced consistently.
* [ ] No silent failure on core data loading without fallback UI.

### Validation

* [ ] Server validators for users.
* [ ] Server validators for listings.
* [ ] Server validators for enquiries/leads.
* [ ] Server validators for organisation/member operations.
* [ ] Client validation mirrors server rules for UX only.

### Logging and monitoring

* [ ] Decide PostHog production policy.
* [ ] Track critical events only: sign-up completed, listing published, enquiry created, lead status changed.
* [ ] Avoid sending personal/sensitive free-text fields to analytics.
* [ ] Add basic error monitoring if needed, but do not add heavyweight observability early.

### Accessibility basics

* [ ] Modal keyboard behaviour.
* [ ] Focus states preserved.
* [ ] Input labels and error messages.
* [ ] Keyboard navigation for cards and filters.
* [ ] Alt text review.
* [ ] Colour contrast review.
* [ ] Reduced-motion behaviour retained.

### SEO basics

* [ ] Route-specific document titles.
* [ ] Landing page meta description.
* [ ] Listing detail title/meta.
* [ ] Open Graph image strategy.
* [ ] `robots.txt` and sitemap later if public listings go live.
* [ ] Consider prerendering only if SPA SEO becomes a real acquisition constraint.

### Performance basics

* [ ] Paginated listing queries.
* [ ] Avoid unbounded Convex reads.
* [ ] Route-level lazy loading for very large pages.
* [ ] Shared Google Maps loader.
* [ ] Image optimisation.
* [ ] Avoid storing large base64 strings in Convex documents.
* [ ] Bundle analysis before adding dependencies.

### Security review

* [ ] No client-controlled role escalation.
* [ ] No public test sessions in production.
* [ ] No public seed mutation in production.
* [ ] Server-side ownership checks on every listing mutation.
* [ ] Server-side permission checks on every lead/enquiry mutation.
* [ ] Safe redirect validation.
* [ ] No sensitive tokens returned to frontend.
* [ ] No secrets in Vite env variables.

### Testing

* [ ] Add lint script.
* [ ] Add build script check in CI.
* [ ] Add minimal smoke tests for route rendering.
* [ ] Add Convex unit-style tests for validators/auth helpers if practical.
* [ ] Add e2e smoke test for login mock/dev path only if safe.
* [ ] Manually regression-test visual flows after each phase.

### Deployment process

* [ ] Define local, preview, production envs.
* [ ] Document `npm install`, `npm run convex:dev`, `npm run dev`, `npm run build`.
* [ ] Document Convex deploy command.
* [ ] Document WorkOS redirect/CORS setup.
* [ ] Document seeding/import process.
* [ ] Confirm Vercel SPA rewrite.
* [ ] Create rollback plan for schema migrations.

## 9. Incremental implementation plan

### Phase 1: Stabilise

Goal: make the current app understandable and safe to modify.

Concrete tasks:

* Add a short architecture note documenting current routes, roles, Convex tables, and auth flow.
* Add lint/build/typecheck scripts where possible without changing runtime behaviour.
* [done] Add a central Convex role helper for server-side permission checks.
* Add/finish a central frontend role helper and use it consistently in route/nav code.
* Identify and mark legacy unused files.
* [done] Remove production exposure of test-session paths by gating them behind `ENABLE_TEST_AUTH=true`.
* [done] Strip sensitive fields, including `testSessionToken`, from `sanitizeUser`.
* [done] Stop calling public seed mutation on normal client boot.
* [done] Gate seed mutation behind `ENABLE_SEED_DATA=true`.
* [done] Split safe profile updates from active role switching.
* [done] Remove public self-grant role mutation.
* Add production env checks.
* Add real Convex/auth integration tests when a test harness exists; current coverage is a static auth-safety check.

Files likely affected:

* `README.md`
* `package.json`
* `src/App.jsx`
* `src/lib/router.js`
* `src/lib/navbarRoles.js`
* `src/lib/convex.js`
* `src/main.jsx`
* `src/state/AppState.jsx`
* `convex/users.js`
* `convex/setup.js`
* `convex/lib.js`
* `scripts/auth-safety-check.mjs`

Risk level: medium, because auth and bootstrap are involved.

How to verify nothing broke:

* `npm run test:auth-safety` passes.
* `npm run build` passes.
* `npx convex codegen --dry-run --typecheck disable` passes.
* Public landing page loads.
* Public `/app/rent` loads.
* Public listing detail loads.
* WorkOS login still redirects and returns.
* New user still reaches onboarding.
* Existing renter reaches `/app/rent`.
* Existing broker reaches `/app/my-listings`.
* Existing company admin reaches `/app/admin`.
* Favourites and viewing request still work for renter.
* Publish flow still creates a draft for broker.

What not to touch yet:

* Do not redesign UI.
* Do not split large page components yet.
* Do not convert everything to TypeScript.
* Do not introduce organisation model yet.
* Do not delete legacy files until confirmed.

### Phase 2: Separate concerns

Goal: introduce clearer boundaries without changing behaviour.

Concrete tasks:

* Move route definitions into a route config.
* Extract auth/session sync from `AppState`.
* Extract listing actions into a listings hook/service.
* Extract enquiry/lead actions into a feature service.
* Move shared pure backend/frontend utilities out of inappropriate locations.
* Extract stable UI pieces from `RentPage`, `ListingDetailPage`, and `PublishPage`.
* Move admin static data out of `AdminPanelPage`.

Files likely affected:

* `src/App.jsx`
* `src/state/AppState.jsx`
* `src/api/*`
* `src/pages/app/RentPage.jsx`
* `src/pages/app/ListingDetailPage.jsx`
* `src/pages/app/PublishPage.jsx`
* `src/pages/app/AdminPanelPage.jsx`
* `src/components/app/*`
* `src/lib/*`
* `convex/lib.js`
* `src/data/*`

Risk level: medium to high if too much is moved at once. Keep commits small.

How to verify nothing broke:

* Compare main screens visually before/after.
* Run manual search/filter scenarios.
* Open listing detail and gallery.
* Submit listing draft.
* Publish listing.
* Request viewing.
* Change lead status.
* Navigate between renter/broker/admin roles.

What not to touch yet:

* Do not change data model semantics.
* Do not change listing status behaviour beyond security patches already done.
* Do not change visual spacing/typography unless fixing obvious bugs.
* Do not remove admin/messages prototypes yet unless product agrees.

### Phase 3: Harden backend and auth

Goal: enforce correctness and security server-side.

Concrete tasks:

* Replace `v.any()` on listing, user, lead, viewing mutations with explicit validators.
* [done for user role safety] Split `updateMe` into:

  * safe profile-only `updateMe`
  * `switchActiveRole`
  * server/admin-only role grant.

* Add a real admin/invite/verification flow that calls the internal role grant path.
* Add explicit listing status transition mutations.
* Prevent duplicate viewing/enquiry per listing/renter.
* Prevent renters enquiring on their own listing.
* Add required indexes.
* Paginate listing search.
* Move image handling towards storage references.
* Add organisation/member model if company admin and shared landlord ownership are real requirements.

Files likely affected:

* `convex/schema.js`
* `convex/users.js`
* `convex/listings.js`
* `convex/viewings.js`
* `convex/leads.js`
* `convex/favorites.js`
* `convex/lib.js`
* new `convex/organisations.js`
* new `convex/validators.js`
* `src/api/*`
* publish/manage/listing pages using changed APIs.

Risk level: high, because this changes backend contracts.

How to verify nothing broke:

* Existing seed/demo listings visible publicly.
* Owner can still see own drafts.
* Non-owner cannot update another listing.
* Renter can favourite published listing.
* Renter cannot create duplicate enquiry.
* Broker can create/update own listing.
* Broker cannot grant self company admin.
* Renter cannot grant self broker or company admin.
* Company admin access works only for granted users.
* Public user cannot call protected mutations successfully.

What not to touch yet:

* Do not redesign OpenImmo import UI.
* Do not build a full admin approval product unless launch scope requires it.
* Do not migrate all historical data in one risky step.

### Phase 4: Polish production UX

Goal: improve reliability, accessibility, loading states, and edge cases.

Concrete tasks:

* Add shared `LoadingState`, `ErrorState`, `EmptyState`.
* Add listing not found and unavailable states.
* Improve form inline validation.
* Add modal focus management.
* Add keyboard accessibility for listing cards and filters.
* Add route-level document titles.
* Replace fake password reset.
* Standardise map loading/fallback behaviour.
* Add image alt text review.
* Add better empty states for leads/viewings/favourites.

Files likely affected:

* `src/shared/ui/*`
* `src/pages/*`
* `src/pages/app/*`
* `src/components/app/*`
* `src/components/layout/*`
* `src/lib/googleMaps.js`
* `src/pages/ForgotPasswordPage.jsx`

Risk level: low to medium.

How to verify nothing broke:

* Keyboard-only navigation through public search.
* Modal open/close via keyboard.
* Form errors are visible and understandable.
* Empty favourites/leads/viewings show useful messages.
* Missing Google Maps key does not break pages.
* Reduced-motion preference still respected.

What not to touch yet:

* Do not change the brand direction.
* Do not rework core flows.
* Do not add large UI libraries.

### Phase 5: Prepare deployment

Goal: make the app ready for real users.

Concrete tasks:

* Finalise environment documentation.
* Confirm WorkOS production redirect/CORS.
* Confirm Convex production deployment.
* Disable dev/test-only flows.
* Run production build in CI.
* Add minimal smoke tests.
* Add security review checklist.
* Add production seed/import process.
* Add rollback/migration notes.
* Review analytics/privacy behaviour.
* Review assets and bundle size.

Files likely affected:

* `README.md`
* `convex.json`
* `vercel.json`
* `.env.example`
* `package.json`
* deployment/CI config if added
* `src/lib/env.js`
* Convex seed/import files.

Risk level: medium.

How to verify nothing broke:

* Fresh production-like environment boots.
* WorkOS login works on preview and production URLs.
* Public pages work without auth.
* Authenticated protected pages redirect correctly.
* Convex auth identity resolves correctly.
* Real listing create/update/publish works.
* No test users or seed controls are exposed.

What not to touch yet:

* Do not add complex CI/CD beyond build/test/deploy basics.
* Do not introduce paid monitoring or advanced infrastructure until usage justifies it.
* Do not optimise prematurely beyond obvious bundle/query/media issues.

## 10. Execution rules

Before any code change, use this sequence:

1. Agree the phase and scope.
2. Make the smallest coherent change.
3. Preserve the current UI and user-facing behaviour.
4. Keep Vite, React, Convex and WorkOS AuthKit.
5. Avoid broad renames unless they remove real confusion, such as `publisher` to `broker`.
6. Avoid new dependencies unless there is a concrete reason.
7. Keep the app running after each change.
8. After each change, document:

   * what changed
   * why it changed
   * how to test it
   * what was deliberately left alone.

Implementation priorities should be:

1. [done] Server-side auth and role safety.
2. Production/test environment separation docs and env checks.
3. Convex validation and listing status rules.
4. Bounded queries and storage-safe media handling.
5. Frontend separation of concerns.
6. Accessibility, error states, and deployment polish.

The main thing not to do is a big-bang rewrite. The current app has real product value in its UI, flows, and domain structure. Professionalising it means putting guardrails underneath that product, then extracting maintainable boundaries around the parts that already work.
