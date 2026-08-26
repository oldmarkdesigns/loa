import { apiClient, ApiError } from "./client";
import { convexApiRefs } from "../lib/convex";

export const authApi = {
  session: () => apiClient.query(convexApiRefs.users.me, {}, "Kunde inte läsa aktuell session."),
  checkEmailRegistered: (email) =>
    apiClient.query(convexApiRefs.users.checkEmailRegistered, { email }, "Kunde inte kontrollera e-post."),
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
  findCompanyByOrganizationNumber: (organizationNumber, excludeUserId) =>
    apiClient.query(
      convexApiRefs.users.findCompanyByOrganizationNumber,
      { organizationNumber, excludeUserId },
      "Kunde inte kontrollera organisationsnumret."
    ),
  updateMe: (payload) => apiClient.mutation(convexApiRefs.users.updateMe, payload, "Kunde inte uppdatera profilen."),
  completeSignup: (payload) => apiClient.mutation(convexApiRefs.users.completeSignup, payload, "Kunde inte slutföra registreringen."),
  switchActiveRole: (role) => apiClient.mutation(convexApiRefs.users.switchActiveRole, { role }, "Kunde inte byta roll."),
  completeOnboarding: (payload) =>
    apiClient.mutation(convexApiRefs.users.completeOnboarding, payload, "Kunde inte slutföra onboarding."),
  listNotifications: () => apiClient.query(convexApiRefs.users.listNotifications, {}, "Kunde inte läsa notiser."),
  listMyCompanies: () => apiClient.query(convexApiRefs.users.listMyCompanies, {}, "Kunde inte läsa dina bolag."),
  switchActiveCompany: (companyId) =>
    apiClient.mutation(convexApiRefs.users.switchActiveCompany, { companyId }, "Kunde inte byta bolag."),
  listCompanyBrokers: () => apiClient.query(convexApiRefs.users.listCompanyBrokers, {}, "Kunde inte läsa mäklarteamet."),
  approveBrokerRequest: (userId) =>
    apiClient.mutation(convexApiRefs.users.approveBrokerRequest, { userId }, "Kunde inte godkänna mäklaren."),
  rejectBrokerRequest: (userId) =>
    apiClient.mutation(convexApiRefs.users.rejectBrokerRequest, { userId }, "Kunde inte avslå mäklaren."),
  resendBrokerVerificationRequest: () =>
    apiClient.mutation(convexApiRefs.users.resendBrokerVerificationRequest, {}, "Kunde inte skicka förfrågan igen."),
  updateCompanyBroker: (userId, payload) =>
    apiClient.mutation(convexApiRefs.users.updateCompanyBroker, { userId, ...payload }, "Kunde inte uppdatera mäklaren."),
  removeCompanyBroker: (userId) =>
    apiClient.mutation(convexApiRefs.users.removeCompanyBroker, { userId }, "Kunde inte ta bort mäklaren.")
};

export const listingApi = {
  getListings: (filters = {}) => apiClient.query(convexApiRefs.listings.list, { filters }, "Kunde inte läsa objekt."),
  getListing: (id) => apiClient.query(convexApiRefs.listings.get, { id }, "Objektet hittades inte."),
  recordView: (id, source) =>
    apiClient.mutation(convexApiRefs.listings.recordView, { id, source }, "Kunde inte registrera visning."),
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

export const leadActivitiesApi = {
  getActivities: (leadId) =>
    apiClient.query(convexApiRefs.leadActivities.list, { leadId }, "Kunde inte läsa aktivitetsloggen."),
  addActivity: (leadId, type, body) =>
    apiClient.mutation(convexApiRefs.leadActivities.create, { leadId, type, body }, "Kunde inte spara aktiviteten.")
};

export const aiApi = {
  runSearch: (payload) => apiClient.query(convexApiRefs.ai.search, payload, "Kunde inte köra AI-sökningen.")
};
