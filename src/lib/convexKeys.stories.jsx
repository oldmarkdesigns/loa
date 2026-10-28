import { convexToJson, jsonToConvex } from "convex/values";
import { expect } from "storybook/test";
import { decodeConvexKeys, decodeKey, encodeConvexKeys, encodeKey } from "./convexKeys";

// Not a component: the rules for object keys that Convex accepts, checked with Convex's own serializer. Nothing is drawn.
const meta = {
  title: "Lib/Convex keys",
  tags: ["ai-generated", "needs-work"],
  render: () => <p className="p-4 text-sm">Se Interactions.</p>
};

export default meta;

const program = {
  id: "program-1",
  title: "Kontor",
  contextNotes: { Övrigt: "Vi söker ett ljust kontor", "Läge och tillgång": "Nära tunnelbana", Team: "Bara ASCII" }
};

// The report: creating a lokalprogram failed with "Field name Övrigt has invalid character 'Ö'".
export const SwedishKeysCanBeSent = {
  play: async () => {
    await expect(() => convexToJson({ profile: { renterPrograms: [program] } })).toThrow(/invalid character/);

    const sent = encodeConvexKeys({ profile: { renterPrograms: [program] } });
    await expect(Object.keys(sent.profile.renterPrograms[0].contextNotes)).toEqual(expect.arrayContaining(["Team", "~%C3%96vrigt"]));
    // What Convex takes and gives back (it sorts the keys) is the program again once the keys are decoded.
    const received = decodeConvexKeys(jsonToConvex(convexToJson(sent)));
    await expect(received.profile.renterPrograms[0].contextNotes).toEqual(program.contextNotes);
    await expect(received.profile.renterPrograms[0].title).toBe("Kontor");
  }
};

export const AsciiIsLeftAlone = {
  play: async () => {
    const plain = { a: [1, { b: "c" }], "with space": { d: null } };
    // The same object comes back when there is nothing to change, so nothing is copied for the common case.
    await expect(encodeConvexKeys(plain)).toBe(plain);
    await expect(decodeConvexKeys(plain)).toBe(plain);
    await expect(encodeKey("Team")).toBe("Team");
    // A key that only looks encoded is not decoded: only what encodeKey made (which decodes to non-ASCII) is undone.
    await expect(decodeKey("~%41")).toBe("~%41");
  }
};

export const AnyKeyRoundTrips = {
  play: async () => {
    for (const key of ["Övrigt", "Ändamål", "50% ~ Ö", "Hej 👋", "$Ö"]) {
      const stored = encodeKey(key);
      await expect(/^[\x20-\x7e]+$/.test(stored)).toBe(true);
      await expect(decodeKey(stored)).toBe(key);
    }
  }
};
