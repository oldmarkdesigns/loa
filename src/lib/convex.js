import { ConvexReactClient } from "convex/react";
import { makeFunctionReference } from "convex/server";

const fallbackConvexUrl = "https://placeholder.convex.cloud";
const fallbackRedirectUri =
  typeof window !== "undefined" ? `${window.location.origin}/callback` : "http://localhost:5173/callback";

export const hasConvexConfig = Boolean(import.meta.env.VITE_CONVEX_URL);
export const hasWorkosConfig = Boolean(import.meta.env.VITE_WORKOS_CLIENT_ID && import.meta.env.VITE_WORKOS_REDIRECT_URI);
export const workosRedirectUri = import.meta.env.VITE_WORKOS_REDIRECT_URI || fallbackRedirectUri;
export const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL || fallbackConvexUrl);

function queryRef(name) {
  return makeFunctionReference(name);
}

function mutationRef(name) {
  return makeFunctionReference(name);
}

export const convexApiRefs = {
  setup: {
    ensureSeeded: mutationRef("setup:ensureSeeded")
  },
  users: {
    me: queryRef("users:me"),
    upsertFromAuth: mutationRef("users:upsertFromAuth"),
    updateMe: mutationRef("users:updateMe"),
    completeOnboarding: mutationRef("users:completeOnboarding")
  },
  listings: {
    list: queryRef("listings:list"),
    get: queryRef("listings:get"),
    create: mutationRef("listings:create"),
    update: mutationRef("listings:update"),
    remove: mutationRef("listings:remove"),
    publish: mutationRef("listings:publish"),
    requestVerification: mutationRef("listings:requestVerification")
  },
  favorites: {
    list: queryRef("favorites:list"),
    add: mutationRef("favorites:add"),
    remove: mutationRef("favorites:remove")
  },
  viewings: {
    create: mutationRef("viewings:create"),
    list: queryRef("viewings:list")
  },
  leads: {
    list: queryRef("leads:list"),
    update: mutationRef("leads:update")
  },
  ai: {
    search: queryRef("ai:search")
  }
};
