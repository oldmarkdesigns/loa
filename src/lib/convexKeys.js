/**
 * Convex accepts only printable ASCII in the field names of an object. A few objects of the app are keyed by a Swedish label (the
 * notes of a lokalprogram are kept under "Övrigt", "Läge och tillgång", ...), and sending one of them fails on the client with
 * "Field name Övrigt has invalid character 'Ö'". The API client (src/api/client.js) therefore writes such a key as "~" and its
 * percent-encoding on the way to Convex, and reads it back on the way from it, so the rest of the app never sees the difference.
 * Keys that are already ASCII are left alone, and so is any value that has no such key (the same object is returned).
 */

const PRINTABLE_ASCII = /^[\x20-\x7e]*$/;
const MARK = "~";

/** The key as Convex can store it. */
export function encodeKey(key) {
  return PRINTABLE_ASCII.test(key) ? key : MARK + encodeURIComponent(key);
}

/** The key as the app wrote it: only what `encodeKey` produced (it decodes to something that is not ASCII) is undone. */
export function decodeKey(key) {
  if (key[0] !== MARK || !/%[0-9A-Fa-f]{2}/.test(key)) return key;
  try {
    const decoded = decodeURIComponent(key.slice(1));
    return PRINTABLE_ASCII.test(decoded) ? key : decoded;
  } catch {
    return key;
  }
}

const isPlainObject = (value) => {
  if (value === null || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

function mapKeys(value, mapKey) {
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const mapped = mapKeys(item, mapKey);
      if (mapped !== item) changed = true;
      return mapped;
    });
    return changed ? next : value;
  }
  if (!isPlainObject(value)) return value;
  let changed = false;
  const entries = Object.entries(value).map(([key, item]) => {
    const mappedKey = mapKey(key);
    const mapped = mapKeys(item, mapKey);
    if (mappedKey !== key || mapped !== item) changed = true;
    return [mappedKey, mapped];
  });
  return changed ? Object.fromEntries(entries) : value;
}

/** The arguments of a Convex call with every key made storable. */
export const encodeConvexKeys = (value) => mapKeys(value, encodeKey);

/** What came back from Convex with the keys the app wrote. */
export const decodeConvexKeys = (value) => mapKeys(value, decodeKey);
