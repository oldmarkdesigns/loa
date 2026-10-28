import { convex, convexApiRefs, hasConvexConfig } from "../lib/convex";
import { decodeConvexKeys, encodeConvexKeys } from "../lib/convexKeys";

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function requireConvex() {
  if (!hasConvexConfig) {
    throw new ApiError(500, "Convex är inte konfigurerat. Lägg till VITE_CONVEX_URL och starta Convex.");
  }
}

function normalizeError(error, fallbackMessage = "Ett okänt API-fel uppstod.") {
  if (error instanceof ApiError) {
    return error;
  }

  const message = error?.data?.message || error?.message || fallbackMessage;
  const status = Number(error?.data?.status || error?.status || 500);
  return new ApiError(status, message);
}

async function run(kind, reference, args = {}, fallbackMessage) {
  requireConvex();

  try {
    // Convex only takes ASCII field names, and some of the app's objects are keyed by a Swedish label (see src/lib/convexKeys.js).
    return decodeConvexKeys(await convex[kind](reference, encodeConvexKeys(args)));
  } catch (error) {
    throw normalizeError(error, fallbackMessage);
  }
}

export const apiClient = {
  query(reference, args = {}, fallbackMessage) {
    return run("query", reference, args, fallbackMessage);
  },
  mutation(reference, args = {}, fallbackMessage) {
    return run("mutation", reference, args, fallbackMessage);
  },
  action(reference, args = {}, fallbackMessage) {
    return run("action", reference, args, fallbackMessage);
  },
  ensureSeeded() {
    return run("mutation", convexApiRefs.setup.ensureSeeded, {}, "Kunde inte initiera grunddata.");
  }
};

export { ApiError };
