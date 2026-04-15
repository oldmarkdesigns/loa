import { apiClient } from "./client";

export const authApi = {
  signup: (payload) => apiClient.request("POST", "/api/auth/signup", payload),
  login: (payload) => apiClient.request("POST", "/api/auth/login", payload),
  clerkSession: (payload) => apiClient.request("POST", "/api/auth/clerk-session", payload),
  logout: () => apiClient.request("POST", "/api/auth/logout"),
  session: () => apiClient.request("GET", "/api/auth/session")
};

export const profileApi = {
  getMe: () => apiClient.request("GET", "/api/me"),
  updateMe: (payload) => apiClient.request("PATCH", "/api/me", payload),
  completeOnboarding: (payload) => apiClient.request("POST", "/api/onboarding/complete", payload)
};

export const listingApi = {
  getListings: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.set(key, value.join(","));
        }
        return;
      }

      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return apiClient.request("GET", `/api/listings${suffix}`);
  },
  getListing: (id) => apiClient.request("GET", `/api/listings/${id}`),
  createListing: (payload) => apiClient.request("POST", "/api/listings", payload),
  updateListing: (id, payload) => apiClient.request("PATCH", `/api/listings/${id}`, payload),
  deleteListing: (id) => apiClient.request("DELETE", `/api/listings/${id}`),
  publishListing: (id) => apiClient.request("POST", `/api/listings/${id}/publish`),
  requestVerification: (id) => apiClient.request("POST", `/api/listings/${id}/verify-request`)
};

export const favoriteApi = {
  getFavorites: () => apiClient.request("GET", "/api/favorites"),
  addFavorite: (listingId) => apiClient.request("POST", `/api/favorites/${listingId}`),
  removeFavorite: (listingId) => apiClient.request("DELETE", `/api/favorites/${listingId}`)
};

export const viewingsApi = {
  createViewing: (payload) => apiClient.request("POST", "/api/viewings", payload),
  getViewings: () => apiClient.request("GET", "/api/viewings")
};

export const leadsApi = {
  getLeads: () => apiClient.request("GET", "/api/leads"),
  updateLead: (id, payload) => apiClient.request("PATCH", `/api/leads/${id}`, payload)
};

export const aiApi = {
  runSearch: (payload) => apiClient.request("POST", "/api/ai/search", payload)
};
