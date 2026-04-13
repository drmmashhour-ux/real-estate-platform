/**
 * Permission-based CSV import for growth leads (owner/broker-provided lists, event signups with consent).
 * Does not validate email deliverability — operators review before outreach.
 */

import type { GrowthEngineLeadRole, GrowthEnginePermissionStatus } from "@prisma/client";

export type CsvImportRow = {
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  type: GrowthEngineLeadRole;
};

export type CsvImportResult = {
  rows: CsvImportRow[];
  errors: string[];
};

const HEADERS = ["name", "email", "phone", "city", "type"];

function normalizeRole(raw: string): GrowthEngineLeadRole | null {
  const t = raw.trim().toLowerCase();
  if (["owner", "seller"].includes(t)) return "owner";
  if (["broker", "agent"].includes(t)) return "broker";
  if (["buyer", "guest"].includes(t)) return "buyer";
  if (["host", "bnb", "bnhub"].includes(t)) return "host";
  return null;
}

/** Parse CSV text; first row may be headers (matched case-insensitively). */
export function parseGrowthCsv(text: string): CsvImportResult {
  const errors: string[] = [];
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { rows: [], errors: ["Empty file"] };
  }

  let start = 0;
  const first = lines[0].toLowerCase();
  if (HEADERS.some((h) => first.includes(h))) {
    start = 1;
  }

  const rows: CsvImportRow[] = [];
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    const parts = splitCsvLine(line);
    if (parts.length < 2) {
      errors.push(`Line ${i + 1}: need at least email or name + type`);
      continue;
    }

    const name = parts[0]?.trim() || null;
    const email = parts[1]?.includes("@") ? parts[1].trim().toLowerCase() : parts[1]?.trim() || null;
    const phone = parts[2]?.trim() || null;
    const city = parts[3]?.trim() || null;
    const typeRaw = (parts[4] ?? parts[3] ?? "buyer").trim();
    const role = normalizeRole(typeRaw || "buyer");

    if (!role) {
      errors.push(`Line ${i + 1}: invalid type (use owner|broker|buyer|host)`);
      continue;
    }
    if (!email && !name) {
      errors.push(`Line ${i + 1}: name or email required`);
      continue;
    }

    rows.push({ name, email, phone, city, type: role });
  }

  return { rows, errors };
}

/** Exported for admin bulk stay import — quoted-field safe. */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      q = !q;
      continue;
    }
    if (!q && c === ",") {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim().replace(/^"|"$/g, ""));
}

export const CSV_IMPORT_DEFAULT_PERMISSION: GrowthEnginePermissionStatus = "granted_by_source";
