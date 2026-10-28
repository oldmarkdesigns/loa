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

export const prospectsApi = {
  generateUploadUrl: () =>
    apiClient.mutation(convexApiRefs.prospects.generateUploadUrl, {}, "Kunde inte förbereda uppladdningen."),
  createProspect: (listingId, title) =>
    apiClient.mutation(convexApiRefs.prospects.create, { listingId, title }, "Kunde inte skapa prospektet."),
  saveDraft: (id, title, sections) =>
    apiClient.mutation(convexApiRefs.prospects.saveDraft, { id, title, sections }, "Kunde inte spara utkastet."),
  publishVersion: (id, changeSummary) =>
    apiClient.mutation(convexApiRefs.prospects.publishVersion, { id, changeSummary }, "Kunde inte publicera versionen."),
  archiveProspect: (id) => apiClient.mutation(convexApiRefs.prospects.archive, { id }, "Kunde inte arkivera prospektet."),
  getProspect: (id) => apiClient.query(convexApiRefs.prospects.get, { id }, "Prospektet hittades inte."),
  listMine: () => apiClient.query(convexApiRefs.prospects.listMine, {}, "Kunde inte läsa dina prospekt."),
  listForListing: (listingId) =>
    apiClient.query(convexApiRefs.prospects.listForListing, { listingId }, "Kunde inte läsa prospekt för objektet."),
  listForCompany: () => apiClient.query(convexApiRefs.prospects.listForCompany, {}, "Kunde inte läsa bolagets prospekt."),
  listVersions: (prospectId) =>
    apiClient.query(convexApiRefs.prospects.listVersions, { prospectId }, "Kunde inte läsa versionshistoriken."),
  restoreVersion: (prospectId, versionNumber) =>
    apiClient.mutation(convexApiRefs.prospects.restoreVersion, { prospectId, versionNumber }, "Kunde inte återställa versionen.")
};

export const prospectCommentsApi = {
  listComments: (prospectId) =>
    apiClient.query(convexApiRefs.prospectComments.list, { prospectId }, "Kunde inte läsa kommentarerna."),
  addComment: (prospectId, sectionId, body) =>
    apiClient.mutation(convexApiRefs.prospectComments.add, { prospectId, sectionId, body }, "Kunde inte spara kommentaren."),
  addGuestComment: (token, sectionId, guestName, body) =>
    apiClient.mutation(
      convexApiRefs.prospectComments.addGuest,
      { token, sectionId, guestName, body },
      "Kunde inte spara kommentaren."
    )
};

export const prospectSharingApi = {
  addCollaborator: (prospectId, userId) =>
    apiClient.mutation(convexApiRefs.prospectSharing.addCollaborator, { prospectId, userId }, "Kunde inte lägga till samarbetspartnern."),
  removeCollaborator: (prospectId, userId) =>
    apiClient.mutation(convexApiRefs.prospectSharing.removeCollaborator, { prospectId, userId }, "Kunde inte ta bort samarbetspartnern."),
  listCollaborators: (prospectId) =>
    apiClient.query(convexApiRefs.prospectSharing.listCollaborators, { prospectId }, "Kunde inte läsa samarbetspartners."),
  createGuestLink: (prospectId, label) =>
    apiClient.mutation(convexApiRefs.prospectSharing.createGuestLink, { prospectId, label }, "Kunde inte skapa gästlänken."),
  revokeGuestLink: (prospectId, guestLinkId) =>
    apiClient.mutation(convexApiRefs.prospectSharing.revokeGuestLink, { prospectId, guestLinkId }, "Kunde inte återkalla gästlänken."),
  listGuestLinks: (prospectId) =>
    apiClient.query(convexApiRefs.prospectSharing.listGuestLinks, { prospectId }, "Kunde inte läsa gästlänkar."),
  getByGuestToken: (token) =>
    apiClient.mutation(convexApiRefs.prospectSharing.getByGuestToken, { token }, "Länken kunde inte öppnas.")
};

export const aiApi = {
  runSearch: (payload) => apiClient.query(convexApiRefs.ai.search, payload, "Kunde inte köra AI-sökningen.")
};

export const matchFeedbackApi = {
  dismiss: (listingId, reason) =>
    apiClient.mutation(convexApiRefs.matchFeedback.dismiss, { listingId, reason }, "Kunde inte spara din återkoppling.")
};
