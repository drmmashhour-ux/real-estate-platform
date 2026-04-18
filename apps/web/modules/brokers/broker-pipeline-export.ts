import type { BrokerProspect } from "@/modules/brokers/broker-pipeline.types";

/** Stable export shape for operator downloads (JSON / CSV). */
export type BrokerProspectExportRow = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  agency?: string;
  source?: string;
  stage: string;
  notesCount: number;
  lastContactAt: string | null;
  firstPurchaseDate: string | null;
  totalSpent: number | null;
  updatedAt: string;
};

export function buildBrokerExportRows(prospects: BrokerProspect[]): BrokerProspectExportRow[] {
  return prospects.map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone,
    agency: p.agency,
    source: p.source,
    stage: p.stage,
    notesCount: p.notes?.length ?? 0,
    lastContactAt: p.lastContactAt ?? null,
    firstPurchaseDate: p.firstPurchaseDate ?? null,
    totalSpent: p.totalSpent ?? null,
    updatedAt: p.updatedAt,
  }));
}

export function exportProspectsAsJson(prospects: BrokerProspect[]): string {
  return JSON.stringify(buildBrokerExportRows(prospects), null, 2);
}

function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportProspectsAsCsv(prospects: BrokerProspect[]): string {
  const rows = buildBrokerExportRows(prospects);
  const headers = [
    "id",
    "name",
    "email",
    "phone",
    "agency",
    "source",
    "stage",
    "notesCount",
    "lastContactAt",
    "firstPurchaseDate",
    "totalSpent",
    "updatedAt",
  ] as const;
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.id),
        csvEscape(r.name),
        csvEscape(r.email),
        csvEscape(r.phone),
        csvEscape(r.agency),
        csvEscape(r.source),
        csvEscape(r.stage),
        csvEscape(r.notesCount),
        csvEscape(r.lastContactAt),
        csvEscape(r.firstPurchaseDate),
        csvEscape(r.totalSpent),
        csvEscape(r.updatedAt),
      ].join(","),
    );
  }
  return lines.join("\n");
}
