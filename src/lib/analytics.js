import posthog from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";
const DUPLICATE_EVENT_STORAGE_KEY = "office_rental_posthog_event_cache_v1";
const DUPLICATE_EVENT_TTL_MS = 60 * 1000;

const allowedEvents = new Set([
  "search_performed",
  "listing_viewed",
  "contact_clicked",
  "signup_started",
  "signup_completed"
]);

export const analyticsEventNames = {
  SEARCH_PERFORMED: "search_performed",
  LISTING_VIEWED: "listing_viewed",
  CONTACT_CLICKED: "contact_clicked",
  SIGNUP_STARTED: "signup_started",
  SIGNUP_COMPLETED: "signup_completed",
  // Legacy names intentionally left for compatibility. trackEvent ignores unsupported names.
  LOGIN_COMPLETED: "login_completed",
  ONBOARDING_COMPLETED: "onboarding_completed",
  LISTING_OPENED: "listing_opened",
  FAVORITE_TOGGLED: "favorite_toggled",
  VIEWING_REQUESTED: "viewing_requested",
  LISTING_PUBLISHED: "listing_published",
  LEAD_STATUS_CHANGED: "lead_status_changed",
  AI_PROMPT_SUBMITTED: "ai_prompt_submitted"
};

function isClient() {
  return typeof window !== "undefined";
}

function sanitizeProps(payload = {}) {
  const blockedKeys = /email|phone|password|token|name|address|message|note|description|query/i;
  const output = {};

  Object.entries(payload).forEach(([key, value]) => {
    if (blockedKeys.test(key)) {
      return;
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      output[key] = value;
    }
  });

  return output;
}

function readDuplicateCache() {
  if (!isClient()) return {};
  try {
    const raw = window.sessionStorage.getItem(DUPLICATE_EVENT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeDuplicateCache(cache) {
  if (!isClient()) return;
  try {
    window.sessionStorage.setItem(DUPLICATE_EVENT_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // ignore write failures
  }
}

function shouldSkipDuplicate(dedupKey, ttlMs = DUPLICATE_EVENT_TTL_MS) {
  if (!dedupKey) return false;
  const now = Date.now();
  const cache = readDuplicateCache();

  Object.keys(cache).forEach((key) => {
    if (!Number.isFinite(cache[key]) || now - cache[key] > ttlMs) {
      delete cache[key];
    }
  });

  if (Number.isFinite(cache[dedupKey]) && now - cache[dedupKey] <= ttlMs) {
    writeDuplicateCache(cache);
    return true;
  }

  cache[dedupKey] = now;
  writeDuplicateCache(cache);
  return false;
}

export function initAnalytics() {
  if (!isClient()) return;
  if (!POSTHOG_KEY) return;
  if (window.__posthogInitialized) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: "history_change",
    capture_pageleave: true,
    autocapture: false
  });

  window.__posthogInitialized = true;
}

export function trackEvent(eventName, payload = {}, options = {}) {
  if (!allowedEvents.has(eventName)) return;
  if (!isClient() || !POSTHOG_KEY) return;

  const dedupKey = options.dedupKey ? `${eventName}:${options.dedupKey}` : "";
  if (dedupKey && shouldSkipDuplicate(dedupKey, options.ttlMs || DUPLICATE_EVENT_TTL_MS)) {
    return;
  }

  posthog.capture(eventName, sanitizeProps(payload));
}

export function trackSearchPerformed(payload = {}) {
  trackEvent(analyticsEventNames.SEARCH_PERFORMED, payload);
}

export function trackListingViewed(payload = {}) {
  trackEvent(analyticsEventNames.LISTING_VIEWED, payload, {
    dedupKey: `listing:${payload.listing_id || "unknown"}`,
    ttlMs: 30 * 1000
  });
}

export function trackContactClicked(payload = {}) {
  trackEvent(analyticsEventNames.CONTACT_CLICKED, payload, {
    dedupKey: `contact:${payload.listing_id || "unknown"}`,
    ttlMs: 30 * 1000
  });
}

export function trackSignupStarted(payload = {}) {
  trackEvent(analyticsEventNames.SIGNUP_STARTED, payload, {
    dedupKey: `signup_started:${payload.role || "unknown"}`,
    ttlMs: 30 * 1000
  });
}

export function trackSignupCompleted(payload = {}) {
  trackEvent(analyticsEventNames.SIGNUP_COMPLETED, payload, {
    dedupKey: `signup_completed:${payload.role || "unknown"}`,
    ttlMs: 30 * 1000
  });
}

// Placeholder for backend identity wiring. Keep this call site stable for later.
export function identifyUser(_user) {}
