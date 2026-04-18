/**
 * Resolve dotted paths with optional bracket indices, e.g. deal.parties.buyers[0].fullName
 */

function splitPath(path: string): Array<string | number> {
  const segments: Array<string | number> = [];
  for (const raw of path.split(".")) {
    const m = /^(\w+)\[(\d+)\]$/.exec(raw);
    if (m) {
      segments.push(m[1], Number(m[2]));
    } else {
      segments.push(raw);
    }
  }
  return segments;
}

export function getValueAtPath(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const seg of splitPath(path)) {
    if (cur === null || cur === undefined) return undefined;
    if (typeof seg === "number") {
      if (!Array.isArray(cur)) return undefined;
      cur = cur[seg];
    } else {
      if (typeof cur !== "object") return undefined;
      cur = (cur as Record<string, unknown>)[seg];
    }
  }
  return cur;
}

export function formatPreviewValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && Number.isFinite(value)) {
    return value >= 1000 ? value.toLocaleString("en-CA", { maximumFractionDigits: 2 }) : String(value);
  }
  return String(value);
}
