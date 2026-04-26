import { mutationGeneric } from "convex/server";
import { ensureSeedData } from "./lib.js";

export const ensureSeeded = mutationGeneric({
  args: {},
  handler: async (ctx) => {
    if (process.env.ENABLE_SEED_DATA !== "true") {
      throw new Error("Seedning är inte aktiverad.");
    }

    const seeded = await ensureSeedData(ctx);
    return { seeded };
  }
});
