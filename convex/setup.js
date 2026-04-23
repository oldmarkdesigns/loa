import { mutationGeneric } from "convex/server";
import { ensureSeedData } from "./lib.js";

export const ensureSeeded = mutationGeneric({
  args: {},
  handler: async (ctx) => {
    const seeded = await ensureSeedData(ctx);
    return { seeded };
  }
});
