import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useClerk, useUser } from "@clerk/react";
import { aiApi, authApi, favoriteApi, leadsApi, listingApi, profileApi, viewingsApi } from "../api";
import {
  analyticsEventNames,
  trackEvent,
  trackSearchPerformed,
  trackSignupCompleted
} from "../lib/analytics";

const AppStateContext = createContext(null);
const OPEN_ACCESS_MODE = false;
const OPEN_ACCESS_CREDENTIALS = [
  { email: "kombi@demo.se", password: "demo123" },
  { email: "annonsor@demo.se", password: "demo123" },
  { email: "hyresgast@demo.se", password: "demo123" }
];

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

export function AppProvider({ children }) {
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn: isClerkSignedIn } = useUser();
  const { signOut: signOutClerk } = useClerk();
  const clerkSyncInFlightRef = useRef(false);
  const lastSyncedClerkUserIdRef = useRef(null);
  const clerkSignoutSyncInFlightRef = useRef(false);
  const clerkSignoutTimeoutRef = useRef(null);

  const [isBootstrapping, setIsBootstrapping] = useState(true);
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

    const [{ listings: listingsData }, { favorites: favoriteData }, { viewings: viewingData }] = await Promise.all([
      listingApi.getListings(allListingsFilters),
      favoriteApi.getFavorites(),
      viewingsApi.getViewings()
    ]);

    setListings(listingsData);
    setFavorites(favoriteData);
    setViewings(viewingData);

    const activeRoles = Array.isArray(activeUser.roles) ? activeUser.roles : [activeUser.role || "renter"];
    const hasPublisherAccess = activeRoles.includes("publisher");

    if (hasPublisherAccess) {
      const { leads: leadData } = await leadsApi.getLeads();
      setLeads(leadData);
    } else {
      setLeads([]);
    }
  }

  async function bootstrapSession() {
    try {
      const { user: existingSessionUser } = await authApi.session();
      let sessionUser = existingSessionUser;

      if (OPEN_ACCESS_MODE && !sessionUser) {
        for (const credentials of OPEN_ACCESS_CREDENTIALS) {
          try {
            const response = await authApi.login(credentials);
            sessionUser = response.user;
            break;
          } catch (_error) {
            // Keep trying fallback demo accounts.
          }
        }
      }

      setUser(sessionUser);
      if (sessionUser) {
        setSavedFiltersState(readSavedFilters(sessionUser.id));
        setFilterPresets(readSavedFilterPresets(sessionUser.id));
        setSavedAiSearches(readSavedAiSearches(sessionUser.id));
        await refreshCoreData(sessionUser);
      } else {
        await loadPublicListings();
      }
    } catch (_error) {
      setUser(null);
      setSavedFiltersState(defaultFilters);
      setFilterPresets([]);
      setSavedAiSearches([]);
      await loadPublicListings();
    } finally {
      setIsBootstrapping(false);
    }
  }

  useEffect(() => {
    bootstrapSession();
  }, []);

  useEffect(() => {
    if (!isClerkLoaded || !clerkUser) {
      return;
    }

    if (user?.id || clerkSyncInFlightRef.current) {
      return;
    }

    if (lastSyncedClerkUserIdRef.current === clerkUser.id) {
      return;
    }

    clerkSyncInFlightRef.current = true;

    loginWithClerk()
      .then(() => {
        lastSyncedClerkUserIdRef.current = clerkUser.id;
      })
      .catch(() => {
        // Keep app usable even if Clerk bridge fails.
      })
      .finally(() => {
        clerkSyncInFlightRef.current = false;
      });
  }, [clerkUser, isClerkLoaded, user?.id]);

  async function signup(payload) {
    const response = await authApi.signup(payload);
    setUser(response.user);
    setSavedFiltersState(readSavedFilters(response.user.id));
    setFilterPresets(readSavedFilterPresets(response.user.id));
    setSavedAiSearches(readSavedAiSearches(response.user.id));
    trackSignupCompleted({
      role: payload.role
    });
    pushToast("Konto skapat. Fortsätt med onboarding.", "success");
    return response.user;
  }

  async function login(payload) {
    const response = await authApi.login(payload);
    setUser(response.user);
    setSavedFiltersState(readSavedFilters(response.user.id));
    setFilterPresets(readSavedFilterPresets(response.user.id));
    setSavedAiSearches(readSavedAiSearches(response.user.id));
    await refreshCoreData(response.user);
    await trackEvent(analyticsEventNames.LOGIN_COMPLETED, {
      role: response.user.role
    });
    pushToast("Inloggning lyckades.", "success");
    return response.user;
  }

  async function loginWithClerk(payload = {}) {
    if (!clerkUser) {
      throw new Error("Clerk-session saknas.");
    }

    const primaryEmail =
      clerkUser.primaryEmailAddress?.emailAddress ||
      clerkUser.emailAddresses?.[0]?.emailAddress ||
      "";

    if (!primaryEmail) {
      throw new Error("Kunde inte läsa e-post från Clerk-konto.");
    }

    const hasRoleOverride = payload.role === "publisher" || payload.role === "company_admin" || payload.role === "renter";
    const safeRole = hasRoleOverride ? payload.role : undefined;
    const safeRoles = Array.isArray(payload.roles)
      ? payload.roles.filter((role) => role === "renter" || role === "publisher" || role === "company_admin")
      : [];
    const uniqueRoles = Array.from(new Set(safeRoles));
    const fullName = String(payload.name || clerkUser.fullName || "").trim();
    const phone = String(payload.phone || "").trim();

    const response = await authApi.clerkSession({
      clerkUserId: clerkUser.id,
      email: primaryEmail,
      name: fullName || primaryEmail.split("@")[0],
      phone,
      ...(safeRole ? { role: safeRole } : {}),
      ...(uniqueRoles.length ? { roles: uniqueRoles } : {}),
      imageUrl: clerkUser.imageUrl || ""
    });

    setUser(response.user);
    setSavedFiltersState(readSavedFilters(response.user.id));
    setFilterPresets(readSavedFilterPresets(response.user.id));
    setSavedAiSearches(readSavedAiSearches(response.user.id));
    await refreshCoreData(response.user);
    return response.user;
  }

  async function loginDemoKombi() {
    return login({
      email: "kombi@demo.se",
      password: "demo123"
    });
  }

  async function clearLocalSessionState() {
    setUser(null);
    setFavorites([]);
    setViewings([]);
    setLeads([]);
    setSavedFiltersState(defaultFilters);
    setFilterPresets([]);
    setSavedAiSearches([]);
    setAiHistory([]);
    await loadPublicListings();
    lastSyncedClerkUserIdRef.current = null;
  }

  async function logout() {
    if (OPEN_ACCESS_MODE) {
      pushToast("Öppet läge är aktivt. Utloggning är tillfälligt avstängd.", "info");
      return user;
    }

    try {
      if (clerkUser) {
        await signOutClerk();
      }
      await authApi.logout();
    } catch (_error) {
      // Always clear local session state even if mock logout request fails.
    } finally {
      await clearLocalSessionState();
      pushToast("Du är utloggad.", "info");
    }
  }

  useEffect(() => {
    if (!isClerkLoaded || isClerkSignedIn !== false || clerkUser || !user || user.authProvider !== "clerk") {
      if (clerkSignoutTimeoutRef.current) {
        window.clearTimeout(clerkSignoutTimeoutRef.current);
        clerkSignoutTimeoutRef.current = null;
      }
      return;
    }

    if (clerkSignoutSyncInFlightRef.current) {
      return;
    }
    clerkSignoutTimeoutRef.current = window.setTimeout(() => {
      clerkSignoutSyncInFlightRef.current = true;

      authApi.logout()
        .catch(() => {
          // Continue and clear local session state.
        })
        .finally(async () => {
          await clearLocalSessionState();
          pushToast("Du är utloggad.", "info");
          clerkSignoutSyncInFlightRef.current = false;
          clerkSignoutTimeoutRef.current = null;
        });
    }, 2000);

    return () => {
      if (clerkSignoutTimeoutRef.current) {
        window.clearTimeout(clerkSignoutTimeoutRef.current);
        clerkSignoutTimeoutRef.current = null;
      }
    };
  }, [clerkUser, isClerkLoaded, isClerkSignedIn, user]);

  async function completeOnboarding(payload) {
    const { user: nextUser } = await profileApi.completeOnboarding(payload);
    setUser(nextUser);
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
      const currentRoles = Array.isArray(user.roles) ? user.roles : [user.role || "renter"];
      const roles = currentRoles.includes(role) ? currentRoles : [...currentRoles, role];
      const { user: nextUser } = await profileApi.updateMe({
        role,
        roles
      });

      setUser(nextUser);
      setSavedFiltersState(readSavedFilters(nextUser.id));
      setFilterPresets(readSavedFilterPresets(nextUser.id));
      setSavedAiSearches(readSavedAiSearches(nextUser.id));

      try {
        await refreshCoreData(nextUser);
      } catch (_error) {
        // Keep role switch successful even if secondary data refresh fails.
      }

      pushToast(`Du bytte till ${role === "renter" ? "hyresgästläge" : role === "company_admin" ? "bolagsadminläge" : "hyresvärdsläge"}.`, "info");
      return nextUser;
    } catch (error) {
      pushToast(error.message || "Kunde inte byta roll just nu.", "error");
      return user;
    }
  }

  async function updateProfile(payload) {
    if (!user) return null;
    const { user: nextUser } = await profileApi.updateMe(payload);
    setUser(nextUser);
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
      signup,
      login,
      loginWithClerk,
      loginDemoKombi,
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
