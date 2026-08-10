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
    findCompanyByOrganizationNumber: queryRef("users:findCompanyByOrganizationNumber"),
    checkEmailRegistered: queryRef("users:checkEmailRegistered"),
    upsertFromAuth: mutationRef("users:upsertFromAuth"),
    updateMe: mutationRef("users:updateMe"),
    completeSignup: mutationRef("users:completeSignup"),
    switchActiveRole: mutationRef("users:switchActiveRole"),
    completeOnboarding: mutationRef("users:completeOnboarding"),
    listNotifications: queryRef("users:listNotifications"),
    listCompanyBrokers: queryRef("users:listCompanyBrokers"),
    approveBrokerRequest: mutationRef("users:approveBrokerRequest"),
    rejectBrokerRequest: mutationRef("users:rejectBrokerRequest"),
    resendBrokerVerificationRequest: mutationRef("users:resendBrokerVerificationRequest"),
    updateCompanyBroker: mutationRef("users:updateCompanyBroker"),
    removeCompanyBroker: mutationRef("users:removeCompanyBroker")
  },
  listings: {
    list: queryRef("listings:list"),
    get: queryRef("listings:get"),
    recordView: mutationRef("listings:recordView"),
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
  leadActivities: {
    list: queryRef("leadActivities:list"),
    create: mutationRef("leadActivities:create")
  },
  ai: {
    search: queryRef("ai:search")
  }
};
