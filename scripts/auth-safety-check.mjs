import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const users = read("convex/users.js");
const convexRefs = read("src/lib/convex.js");
const appState = read("src/state/AppState.jsx");
const lib = read("convex/lib.js");
const setup = read("convex/setup.js");
const schema = read("convex/schema.js");

assert(users.includes("export const switchActiveRole"), "users.switchActiveRole is missing.");
assert(!users.includes("export const addRoleToMe"), "public users.addRoleToMe must not exist.");
assert(!convexRefs.includes("addRoleToMe"), "frontend must not reference users.addRoleToMe.");
assert(!appState.includes("profileApi.addRoleToMe"), "AppState must not call addRoleToMe.");
assert(!appState.includes("setupApi.ensureSeeded"), "client bootstrap must not call ensureSeeded.");
assert(users.includes("role: \"renter\"") && users.includes("roles: [\"renter\"]"), "new WorkOS users must default to renter.");
assert(users.includes("Rollen är inte beviljad"), "switchActiveRole must reject ungranted roles.");
assert(users.includes("requestedRole") && users.includes("roleRequestStatus"), "onboarding must record elevated role requests.");
assert(!users.includes("createTestUser"), "public test signup mutation must not exist.");
assert(!users.includes("getTestSession"), "public test session query must not exist.");
assert(!users.includes("updateTestUser"), "public test profile mutation must not exist.");
assert(!users.includes("completeTestOnboarding"), "public test onboarding mutation must not exist.");
assert(!convexRefs.includes("Test"), "frontend must not reference test auth functions.");
assert(!appState.includes("testSession"), "AppState must not use test sessions.");
assert(setup.includes("ENABLE_SEED_DATA"), "seeding must be env-gated.");

const sanitizeUserBlock = lib.slice(lib.indexOf("export function sanitizeUser"), lib.indexOf("export function stripSystemFields"));
assert(sanitizeUserBlock.includes("tokenIdentifier"), "sanitizeUser must strip tokenIdentifier.");
assert(sanitizeUserBlock.includes("subject"), "sanitizeUser must strip subject.");
assert(sanitizeUserBlock.includes("testSessionToken"), "sanitizeUser must strip testSessionToken.");

const updateMeBlock = users.slice(users.indexOf("export const updateMe"), users.indexOf("export const switchActiveRole"));
assert(!updateMeBlock.includes("role:"), "updateMe must not accept or patch role.");
assert(!updateMeBlock.includes("roles:"), "updateMe must not accept or patch roles.");

console.log("Auth safety static checks passed.");
