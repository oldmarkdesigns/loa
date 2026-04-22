import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import { useConvexAuth } from "convex/react";
import { aiApi, authApi, favoriteApi, leadsApi, listingApi, profileApi, setupApi, viewingsApi } from "../api";
import {
  analyticsEventNames,
  trackEvent,
  trackSearchPerformed,
  trackSignupCompleted
} from "../lib/analytics";

const AppStateContext = createContext(null);
const TEST_SESSION_STORAGE_KEY = "office_rental_test_session_token";

const defaultFilters = {
  county: "Stockholms län",
  query: "",
  district: "Alla",
  type: [],
  minSize: "",
  maxSize: "",
  maxBudget: "",
  teamSize: "",
  transitDistance: "",
  moveInDate: "",
  contractFlex: "",
  accessHours: "",
  parkingType: "",
  layoutType: "",
  requirePrice: false,
  onlyBostadsratt: false,
  includeOperatingCosts: false,
  accessibilityAdapted: false,
  ecoCertified: false,
  daysOnMarket: "all",
  keyword: "",
  advertiser: "Alla",
  verified: false,
  readyNow: false
};

const allListingsFilters = {
  ...defaultFilters
};

function savedFilterKey(userId) {
  return `office_rental_saved_filters_${userId}`;
}

function savedFilterPresetsKey(userId) {
  return `office_rental_saved_filter_presets_${userId}`;
}

function savedAiSearchesKey(userId) {
  return `office_rental_saved_ai_searches_${userId}`;
}

function readSavedFilters(userId) {
  if (!userId) {
    return defaultFilters;
  }

  const raw = window.localStorage.getItem(savedFilterKey(userId));
  if (!raw) {
    return defaultFilters;
  }

  try {
    return normalizeFilters({
      ...defaultFilters,
      ...JSON.parse(raw)
    });
  } catch (_error) {
    return defaultFilters;
  }
}

function persistSavedFilters(userId, filters) {
  if (!userId) {
    return;
  }

  window.localStorage.setItem(savedFilterKey(userId), JSON.stringify(filters));
}

function readSavedFilterPresets(userId) {
  if (!userId) {
    return [];
  }

  const raw = window.localStorage.getItem(savedFilterPresetsKey(userId));
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function persistSavedFilterPresets(userId, presets) {
  if (!userId) {
    return;
  }

  window.localStorage.setItem(savedFilterPresetsKey(userId), JSON.stringify(presets));
}

function readSavedAiSearches(userId) {
  if (!userId) {
    return [];
  }

  const raw = window.localStorage.getItem(savedAiSearchesKey(userId));
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function persistSavedAiSearches(userId, searches) {
  if (!userId) {
    return;
  }

  window.localStorage.setItem(savedAiSearchesKey(userId), JSON.stringify(searches));
}

function normalizeFilters(filters) {
  const rawType = filters?.type;
  const normalizedType = Array.isArray(rawType)
    ? rawType.filter(Boolean)
    : (typeof rawType === "string" && rawType !== "Alla" ? rawType.split(",").map((item) => item.trim()).filter(Boolean) : []);

  return {
    ...defaultFilters,
    ...filters,
    type: normalizedType,
    includeOperatingCosts: Boolean(filters?.includeOperatingCosts),
    accessibilityAdapted: Boolean(filters?.accessibilityAdapted),
    ecoCertified: Boolean(filters?.ecoCertified),
    verified: Boolean(filters?.verified),
    readyNow: Boolean(filters?.readyNow),
    requirePrice: Boolean(filters?.requirePrice),
    onlyBostadsratt: Boolean(filters?.onlyBostadsratt)
  };
}

function filterPresetLabel(filters) {
  const district = filters.district && filters.district !== "Alla" ? filters.district : "Alla områden";
  const selectedTypes = Array.isArray(filters.type) ? filters.type : [];
  const type = selectedTypes.length > 0 ? `${selectedTypes.length} typer` : "Alla typer";
  const budget = String(filters.maxBudget || "").trim() ? `${Number(filters.maxBudget).toLocaleString("sv-SE")} kr` : "utan maxtak";
  return `${district} · ${type} · ${budget}`;
}

function mapRenterProgramToFilters(program) {
  const parsedType = Array.isArray(program?.type)
    ? program.type.filter(Boolean)
    : (typeof program?.type === "string" && program.type.trim() ? program.type.split(",").map((item) => item.trim()).filter(Boolean) : []);

  const districtRaw = String(program?.district || "").trim();
  const districtValues = districtRaw.split(",").map((item) => item.trim()).filter(Boolean);
  const district = districtValues.length > 1 ? "Alla" : districtRaw;
  const contractFlex = String(program?.contractFlex || "").trim();
  const transitDistance = String(program?.transitDistance || "").trim();
  const accessHours = String(program?.accessHours || "").trim();
  const parkingType = String(program?.parkingType || "").trim();
  const layoutType = String(program?.layoutType || "").trim();

  return normalizeFilters({
    ...defaultFilters,
    district: district || "Alla",
    type: parsedType,
    teamSize: String(program?.teamSize || "").trim(),
    minSize: String(program?.minSize || "").trim(),
    maxSize: String(program?.maxSize || "").trim(),
    minBudget: String(program?.minBudget || "").trim(),
    maxBudget: String(program?.maxBudget || "").trim(),
    moveInDate: String(program?.moveInDate || "").trim(),
    contractFlex: contractFlex === "Alla" ? "" : contractFlex,
    transitDistance: transitDistance === "Alla" ? "" : transitDistance,
    accessHours: accessHours === "Alla" ? "" : accessHours,
    parkingType: parkingType === "Alla" ? "" : parkingType,
    layoutType: layoutType === "Alla" ? "" : layoutType,
    includeOperatingCosts: Boolean(program?.includeOperatingCosts),
    accessibilityAdapted: Boolean(program?.accessibilityAdapted),
    ecoCertified: Boolean(program?.ecoCertified)
  });
}

function normalizeUserRole(role) {
  if (role === "publisher") return "broker";
  return role === "company_admin" || role === "broker" ? role : "renter";
}

export function AppProvider({ children }) {
  const { user: authUser, isLoading: isAuthLoading, signOut } = useAuth();
  const { isAuthenticated: isConvexAuthenticated, isLoading: isConvexAuthLoading } = useConvexAuth();
  const authSyncInFlightRef = useRef(false);

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSessionSyncing, setIsSessionSyncing] = useState(true);
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [viewings, setViewings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [savedFilters, setSavedFiltersState] = useState(defaultFilters);
  const [filterPresets, setFilterPresets] = useState([]);
  const [savedAiSearches, setSavedAiSearches] = useState([]);
  const [aiHistory, setAiHistory] = useState([]);
  const [toasts, setToasts] = useState([]);

  function pushToast(message, type = "info") {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3000);
  }

  async function loadPublicListings() {
    try {
      const { listings: listingData } = await listingApi.getListings(allListingsFilters);
      setListings(listingData);
    } catch (_error) {
      setListings([]);
    }
  }

  async function refreshCoreData(activeUser = user) {
    if (!activeUser) {
      await loadPublicListings();
      setFavorites([]);
      setViewings([]);
      setLeads([]);
      return;
    }

    const activeRoles = (Array.isArray(activeUser.roles) ? activeUser.roles : [activeUser.role || "renter"]).map(normalizeUserRole);
    const hasPublisherAccess = activeRoles.includes("broker") || activeRoles.includes("company_admin");
    const hasRenterAccess = activeRoles.includes("renter");

    if (activeUser.authProvider === "test") {
      const { listings: listingsData } = await listingApi.getListings(allListingsFilters);
      setListings(listingsData);
      setFavorites([]);
      setViewings([]);
      setLeads([]);
      return;
    }

    const [{ listings: listingsData }, { favorites: favoriteData }, { viewings: viewingData }] = await Promise.all([
      listingApi.getListings(allListingsFilters),
      hasRenterAccess ? favoriteApi.getFavorites() : Promise.resolve({ favorites: [] }),
      hasRenterAccess ? viewingsApi.getViewings() : Promise.resolve({ viewings: [] })
    ]);

    setListings(listingsData);
    setFavorites(favoriteData);
    setViewings(viewingData);

    if (hasPublisherAccess) {
      const { leads: leadData } = await leadsApi.getLeads();
      setLeads(leadData);
    } else {
      setLeads([]);
    }
  }

  function hydrateLocalUserState(nextUser) {
    setUser(nextUser);

    if (!nextUser) {
      setSavedFiltersState(defaultFilters);
      setFilterPresets([]);
      setSavedAiSearches([]);
      return;
    }

    setSavedFiltersState(readSavedFilters(nextUser.id));
    setFilterPresets(readSavedFilterPresets(nextUser.id));
    setSavedAiSearches(readSavedAiSearches(nextUser.id));
  }

  async function clearLocalSessionState() {
    hydrateLocalUserState(null);
    setFavorites([]);
    setViewings([]);
    setLeads([]);
    setAiHistory([]);
    await loadPublicListings();
  }

  async function bootstrapSession() {
    if (authSyncInFlightRef.current) {
      return;
    }

    authSyncInFlightRef.current = true;
    setIsSessionSyncing(true);

    try {
      await setupApi.ensureSeeded();

      const storedTestToken = typeof window !== "undefined" ? window.localStorage.getItem(TEST_SESSION_STORAGE_KEY) : null;

      if (!isConvexAuthenticated || !authUser) {
        if (storedTestToken) {
          const { user: testUser } = await authApi.getTestSession(storedTestToken);
          if (testUser) {
            hydrateLocalUserState(testUser);
            await refreshCoreData(testUser);
            return;
          }
          window.localStorage.removeItem(TEST_SESSION_STORAGE_KEY);
        }
        await clearLocalSessionState();
        return;
      }

      const { user: syncedUser } = await authApi.syncWorkosSession({
        email: authUser.email,
        name: [authUser.firstName, authUser.lastName].filter(Boolean).join(" ").trim(),
        firstName: authUser.firstName || "",
        lastName: authUser.lastName || "",
        imageUrl: authUser.profilePictureUrl || ""
      });

      hydrateLocalUserState(syncedUser);
      await refreshCoreData(syncedUser);
    } catch (_error) {
      hydrateLocalUserState(null);
      setFavorites([]);
      setViewings([]);
      setLeads([]);
      setAiHistory([]);
      try {
        await loadPublicListings();
      } catch (_loadError) {
        setListings([]);
      }
    } finally {
      setIsBootstrapping(false);
      setIsSessionSyncing(false);
      authSyncInFlightRef.current = false;
    }
  }

  useEffect(() => {
    if (isAuthLoading || isConvexAuthLoading) {
      setIsSessionSyncing(true);
      return undefined;
    }
    bootstrapSession();
    return undefined;
  }, [authUser?.id, isAuthLoading, isConvexAuthLoading, isConvexAuthenticated]);

  async function completeSignup(payload) {
    if (!user) {
      throw new Error("Skapa konto med WorkOS först.");
    }

    const normalizedRole = normalizeUserRole(payload.role);
    const testToken = typeof window !== "undefined" ? window.localStorage.getItem(TEST_SESSION_STORAGE_KEY) : null;
    const { user: nextUser } = user?.authProvider === "test" && testToken
      ? await profileApi.updateTestMe(testToken, {
          ...payload,
          role: normalizedRole,
          roles: [normalizedRole]
        })
      : await profileApi.updateMe({
          ...payload,
          role: normalizedRole,
          roles: [normalizedRole]
        });
    hydrateLocalUserState(nextUser);
    await refreshCoreData(nextUser);
    trackSignupCompleted({
      role: payload.role
    });
    pushToast("Konto skapat. Fortsätt med onboarding.", "success");
    return nextUser;
  }

  async function logout() {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(TEST_SESSION_STORAGE_KEY);
      }
      await clearLocalSessionState();
    } finally {
      if (user?.authProvider !== "test") {
        await Promise.resolve(signOut({
          returnTo: `${window.location.origin}/`
        }));
      }
    }
  }

  async function completeOnboarding(payload) {
    const testToken = typeof window !== "undefined" ? window.localStorage.getItem(TEST_SESSION_STORAGE_KEY) : null;
    const { user: nextUser } = user?.authProvider === "test" && testToken
      ? await profileApi.completeTestOnboarding(testToken, payload)
      : await profileApi.completeOnboarding(payload);
    hydrateLocalUserState(nextUser);
    const renterProgram = payload?.primaryRole === "renter" ? payload?.profile?.renterProgram : null;
    const onboardingFilters = renterProgram ? mapRenterProgramToFilters(renterProgram) : null;

    if (onboardingFilters) {
      setSavedFiltersState(onboardingFilters);
      if (nextUser?.id) {
        persistSavedFilters(nextUser.id, onboardingFilters);
      }
    } else {
      setSavedFiltersState(readSavedFilters(nextUser.id));
    }
    setFilterPresets(readSavedFilterPresets(nextUser.id));
    setSavedAiSearches(readSavedAiSearches(nextUser.id));

    if (onboardingFilters) {
      try {
        const { listings: filteredListings } = await listingApi.getListings(onboardingFilters);
        setListings(filteredListings);
      } catch (_error) {
        await refreshCoreData(nextUser);
      }
    } else {
      await refreshCoreData(nextUser);
    }

    await trackEvent(analyticsEventNames.ONBOARDING_COMPLETED, {
      role: payload.primaryRole
    });
    pushToast("Onboarding slutförd.", "success");
    return nextUser;
  }

  async function switchRole(role) {
    if (!user) {
      return null;
    }

    try {
      const normalizedRole = normalizeUserRole(role);
      const currentRoles = (Array.isArray(user.roles) ? user.roles : [user.role || "renter"]).map(normalizeUserRole);
      const roles = currentRoles.includes(normalizedRole) ? currentRoles : [...currentRoles, normalizedRole];
      const { user: nextUser } = await profileApi.updateMe({
        role: normalizedRole,
        roles
      });

      hydrateLocalUserState(nextUser);

      try {
        await refreshCoreData(nextUser);
      } catch (_error) {
        // Keep role switch successful even if secondary data refresh fails.
      }

      pushToast(`Du bytte till ${normalizedRole === "company_admin" ? "bolagsadminläge" : normalizedRole === "broker" ? "mäklarläge" : "hyresgästläge"}.`, "info");
      return nextUser;
    } catch (error) {
      pushToast(error.message || "Kunde inte byta roll just nu.", "error");
      return user;
    }
  }

  async function updateProfile(payload) {
    if (!user) return null;
    const testToken = typeof window !== "undefined" ? window.localStorage.getItem(TEST_SESSION_STORAGE_KEY) : null;
    const { user: nextUser } = user?.authProvider === "test" && testToken
      ? await profileApi.updateTestMe(testToken, payload)
      : await profileApi.updateMe(payload);
    hydrateLocalUserState(nextUser);
    return nextUser;
  }

  async function createTestSignup(role) {
    const { user: nextUser, token } = await authApi.createTestUser(role);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TEST_SESSION_STORAGE_KEY, token);
    }
    hydrateLocalUserState(nextUser);
    await refreshCoreData(nextUser);
    return nextUser;
  }

  async function searchListings(filters) {
    const normalized = normalizeFilters(filters);

    setSavedFiltersState(normalized);
    if (user?.id) {
      persistSavedFilters(user.id, normalized);
    }

    const { listings: listingData } = await listingApi.getListings(normalized);
    setListings(listingData);
    trackSearchPerformed({
      results_count: Array.isArray(listingData) ? listingData.length : 0,
      has_district_filter: normalized.district !== "Alla",
      has_budget_filter: Boolean(String(normalized.maxBudget || "").trim()),
      has_type_filter: Array.isArray(normalized.type) && normalized.type.length > 0
    });
    return listingData;
  }

  async function resetSearchToAllListings() {
    const normalized = normalizeFilters(allListingsFilters);
    setSavedFiltersState(normalized);
    if (user?.id) {
      persistSavedFilters(user.id, normalized);
    }

    const { listings: listingData } = await listingApi.getListings(allListingsFilters);
    setListings(listingData);
    return listingData;
  }

  async function saveCurrentFilters(filtersOverride = savedFilters) {
    if (!user) return;
    const normalized = normalizeFilters(filtersOverride);
    persistSavedFilters(user.id, normalized);
    setSavedFiltersState(normalized);

    setFilterPresets((previous) => {
      const duplicate = previous.find((item) => JSON.stringify(item.filters) === JSON.stringify(normalized));
      const nextItem = duplicate || {
        id: crypto.randomUUID(),
        title: filterPresetLabel(normalized),
        createdAt: new Date().toISOString()
      };

      const next = [
        {
          ...nextItem,
          filters: normalized,
          updatedAt: new Date().toISOString()
        },
        ...previous.filter((item) => item.id !== nextItem.id)
      ].slice(0, 12);

      persistSavedFilterPresets(user.id, next);
      return next;
    });

    pushToast("Filter sparade.", "success");
  }

  function deleteSavedFilter(filterId) {
    if (!user) return;
    setFilterPresets((previous) => {
      const next = previous.filter((item) => item.id !== filterId);
      persistSavedFilterPresets(user.id, next);
      return next;
    });
    pushToast("Sparat filter borttaget.", "info");
  }

  function saveAiSearch(payload) {
    if (!user) return;
    const prompt = String(payload?.prompt || "").trim();
    if (!prompt) return;

    const filters = normalizeFilters(payload?.filters || savedFilters);

    setSavedAiSearches((previous) => {
      const duplicate = previous.find((item) => item.prompt === prompt && JSON.stringify(item.filters) === JSON.stringify(filters));
      const next = [
        {
          id: duplicate?.id || crypto.randomUUID(),
          prompt,
          filters,
          createdAt: duplicate?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        ...previous.filter((item) => item.id !== duplicate?.id)
      ].slice(0, 20);

      persistSavedAiSearches(user.id, next);
      return next;
    });

    pushToast("AI-sökning sparad.", "success");
  }

  function deleteSavedAiSearch(searchId) {
    if (!user) return;
    setSavedAiSearches((previous) => {
      const next = previous.filter((item) => item.id !== searchId);
      persistSavedAiSearches(user.id, next);
      return next;
    });
    pushToast("Sparad AI-sökning borttagen.", "info");
  }

  async function toggleFavorite(listingId) {
    const exists = favorites.some((entry) => entry.listingId === listingId);
    if (exists) {
      await favoriteApi.removeFavorite(listingId);
    } else {
      await favoriteApi.addFavorite(listingId);
    }

    const { favorites: favoriteData } = await favoriteApi.getFavorites();
    setFavorites(favoriteData);

    await trackEvent(analyticsEventNames.FAVORITE_TOGGLED, {
      listingId,
      state: exists ? "removed" : "added"
    });

    pushToast(exists ? "Sparat objekt borttaget." : "Objekt sparat.", "success");
  }

  async function requestViewing(payload) {
    const { viewing } = await viewingsApi.createViewing(payload);
    const { viewings: viewingData } = await viewingsApi.getViewings();
    setViewings(viewingData);

    await trackEvent(analyticsEventNames.VIEWING_REQUESTED, {
      listingId: payload.listingId
    });

    pushToast("Visningsförfrågan skickad.", "success");
    return viewing;
  }

  async function createListing(payload) {
    const response = await listingApi.createListing(payload);
    await refreshCoreData();
    return response;
  }

  async function updateListing(listingId, payload) {
    const response = await listingApi.updateListing(listingId, payload);
    await refreshCoreData();
    return response;
  }

  async function deleteListing(listingId) {
    await listingApi.deleteListing(listingId);
    await refreshCoreData();
    pushToast("Objektet har raderats.", "success");
  }

  async function publishListing(listingId) {
    const response = await listingApi.publishListing(listingId);
    await refreshCoreData();

    await trackEvent(analyticsEventNames.LISTING_PUBLISHED, {
      listingId
    });

    pushToast("Annons publicerad.", "success");
    return response;
  }

  async function requestListingVerification(listingId) {
    await listingApi.requestVerification(listingId);
    await refreshCoreData();
    pushToast("Verifieringsförfrågan skickad.", "info");
  }

  async function runAiSearch(prompt, currentFilters) {
    const response = await aiApi.runSearch({
      prompt,
      currentFilters
    });

    await trackEvent(analyticsEventNames.AI_PROMPT_SUBMITTED, {
      promptLength: prompt.length
    });

    setAiHistory((previous) => [
      {
        id: crypto.randomUUID(),
        prompt,
        response: response.explanation,
        createdAt: new Date().toISOString()
      },
      ...previous
    ].slice(0, 5));

    return response;
  }

  async function updateLead(leadId, payload) {
    const { lead } = await leadsApi.updateLead(leadId, payload);
    const [{ leads: leadData }, { viewings: viewingData }] = await Promise.all([leadsApi.getLeads(), viewingsApi.getViewings()]);
    setLeads(leadData);
    setViewings(viewingData);

    await trackEvent(analyticsEventNames.LEAD_STATUS_CHANGED, {
      leadId,
      status: payload.status
    });

    pushToast("Intresseanmälan uppdaterad.", "success");
    return lead;
  }

  const value = useMemo(
    () => ({
      isAuthPending: isAuthLoading || isConvexAuthLoading || isSessionSyncing,
      isBootstrapping,
      user,
      listings,
      favorites,
      viewings,
      leads,
      savedFilters,
      filterPresets,
      savedAiSearches,
      aiHistory,
      toasts,
      pushToast,
      completeSignup,
      createTestSignup,
      logout,
      completeOnboarding,
      switchRole,
      updateProfile,
      searchListings,
      resetSearchToAllListings,
      saveCurrentFilters,
      deleteSavedFilter,
      saveAiSearch,
      deleteSavedAiSearch,
      toggleFavorite,
      requestViewing,
      createListing,
      updateListing,
      deleteListing,
      publishListing,
      requestListingVerification,
      runAiSearch,
      updateLead,
      refreshCoreData,
      defaultFilters,
      allListingsFilters
    }),
    [
      aiHistory,
      filterPresets,
      favorites,
      isAuthLoading,
      isConvexAuthLoading,
      isSessionSyncing,
      isBootstrapping,
      leads,
      listings,
      savedAiSearches,
      savedFilters,
      toasts,
      user,
      viewings
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState måste användas inom AppProvider");
  }
  return context;
}
