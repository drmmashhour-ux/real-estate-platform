import { createHash } from "crypto";

export function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return JSON.stringify(
      value.map((v) => (typeof v === "object" && v !== null ? JSON.parse(canonicalStringify(v)) : v))
    );
  }
  const o = value as Record<string, unknown>;
  const keys = Object.keys(o).sort();
  const sorted: Record<string, unknown> = {};
  for (const k of keys) sorted[k] = o[k];
  return JSON.stringify(sorted);
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}
