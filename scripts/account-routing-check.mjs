import assert from "node:assert/strict";
import { canAccessWorkspace, defaultAppPathForUser, publicReturnTo } from "../src/lib/router.js";

globalThis.window = { location: { origin: "http://localhost:5173" } };
const renter = { role: "renter", roles: ["renter"] };
const admin = { role: "renter", roles: ["renter", "company_admin"] };
const broker = { role: "broker", roles: ["renter", "broker"] };
assert.equal(defaultAppPathForUser(admin), "/app/admin", "search mode must retain admin destination");
assert.equal(defaultAppPathForUser(broker), "/app/broker");
assert.equal(defaultAppPathForUser(renter), "/app/profile");
for (const path of ["/app/admin", "/app/admin/annonser", "/app/profile", "/app/publish"]) {
  assert.equal(canAccessWorkspace(null, path), false, "signed-out users must not mount workspace");
}
assert.equal(canAccessWorkspace(renter, "/app/admin"), false);
assert.equal(canAccessWorkspace(broker, "/app/admin"), false);
assert.equal(canAccessWorkspace(admin, "/app/admin/annonser"), true);
assert.equal(canAccessWorkspace(admin, "/app/publish"), true);
assert.equal(canAccessWorkspace(renter, "/app/publish"), false);
assert.equal(canAccessWorkspace(admin, "/admin"), false, "legacy alias stays unregistered");
assert.equal(canAccessWorkspace(admin, "/app/unknown"), false);
assert.equal(publicReturnTo(null), "/callback", "normal login resolves destination after session loads");
assert.equal(publicReturnTo("/app/admin/annonser"), "/app/admin/annonser");
assert.equal(publicReturnTo("/lokaler/L-101?view=detail"), "/lokaler/L-101?view=detail");
for (const target of ["//evil.example", "/\\evil.example", "https://evil.example"]) {
  assert.equal(publicReturnTo(target), "/callback");
}
console.log("Account destinations, role guards and safe auth returns passed.");
