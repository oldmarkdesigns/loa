import { apiClient, ApiError } from "./client";
import { convexApiRefs } from "../lib/convex";

export const authApi = {
  session: () => apiClient.query(convexApiRefs.users.me, {}, "Kunde inte läsa aktuell session."),
  getTestSession: (token) => apiClient.query(convexApiRefs.users.getTestSession, { token }, "Kunde inte läsa testsessionen."),
  createTestUser: (role) => apiClient.mutation(convexApiRefs.users.createTestUser, role ? { role } : {}, "Kunde inte skapa testkonto."),
  syncWorkosSession: (payload = {}) =>
    apiClient.mutation(convexApiRefs.users.upsertFromAuth, payload, "Kunde inte synka WorkOS-sessionen."),
  signup: async () => {
    throw new ApiError(410, "Registrering hanteras av WorkOS.");
  },
  login: async () => {
    throw new ApiError(410, "Inloggning hanteras av WorkOS.");
  },
  logout: async () => ({ ok: true })
};

export const setupApi = {
  ensureSeeded: () => apiClient.ensureSeeded()
};

export const profileApi = {
  getMe: () => apiClient.query(convexApiRefs.users.me, {}, "Kunde inte läsa användarprofilen."),
  updateMe: (payload) => apiClient.mutation(convexApiRefs.users.updateMe, payload, "Kunde inte uppdatera profilen."),
  updateTestMe: (token, payload) => apiClient.mutation(convexApiRefs.users.updateTestUser, { token, ...payload }, "Kunde inte uppdatera testprofilen."),
  addRoleToMe: (role) => apiClient.mutation(convexApiRefs.users.addRoleToMe, { role }, "Kunde inte lägga till rollen."),
  addRoleToTestUser: (token, role) => apiClient.mutation(convexApiRefs.users.addRoleToTestUser, { token, role }, "Kunde inte lägga till testrollen."),
  completeOnboarding: (payload) =>
    apiClient.mutation(convexApiRefs.users.completeOnboarding, payload, "Kunde inte slutföra onboarding."),
  completeTestOnboarding: (token, payload) =>
    apiClient.mutation(convexApiRefs.users.completeTestOnboarding, { token, ...payload }, "Kunde inte slutföra test-onboarding.")
};

export const listingApi = {
  getListings: (filters = {}) => apiClient.query(convexApiRefs.listings.list, { filters }, "Kunde inte läsa objekt."),
  getListing: (id) => apiClient.query(convexApiRefs.listings.get, { id }, "Objektet hittades inte."),
  createListing: (payload) => apiClient.mutation(convexApiRefs.listings.create, { payload }, "Kunde inte skapa objektet."),
  updateListing: (id, payload) =>
    apiClient.mutation(convexApiRefs.listings.update, { id, payload }, "Kunde inte uppdatera objektet."),
  deleteListing: (id) => apiClient.mutation(convexApiRefs.listings.remove, { id }, "Kunde inte radera objektet."),
  publishListing: (id) =>
    apiClient.mutation(convexApiRefs.listings.publish, { id }, "Kunde inte publicera objektet."),
  requestVerification: (id) =>
    apiClient.mutation(
      convexApiRefs.listings.requestVerification,
      { id },
      "Kunde inte skicka verifieringsförfrågan."
    )
};

export const favoriteApi = {
  getFavorites: () => apiClient.query(convexApiRefs.favorites.list, {}, "Kunde inte läsa sparade objekt."),
  addFavorite: (listingId) =>
    apiClient.mutation(convexApiRefs.favorites.add, { listingId }, "Kunde inte spara objektet."),
  removeFavorite: (listingId) =>
    apiClient.mutation(convexApiRefs.favorites.remove, { listingId }, "Kunde inte ta bort objektet.")
};

export const viewingsApi = {
  createViewing: (payload) =>
    apiClient.mutation(convexApiRefs.viewings.create, payload, "Kunde inte skapa visningsförfrågan."),
  getViewings: () => apiClient.query(convexApiRefs.viewings.list, {}, "Kunde inte läsa visningar.")
};

export const leadsApi = {
  getLeads: () => apiClient.query(convexApiRefs.leads.list, {}, "Kunde inte läsa intresseanmälningar."),
  updateLead: (id, payload) =>
    apiClient.mutation(convexApiRefs.leads.update, { id, payload }, "Kunde inte uppdatera intresseanmälan.")
};

export const aiApi = {
  runSearch: (payload) => apiClient.query(convexApiRefs.ai.search, payload, "Kunde inte köra AI-sökningen.")
};
