import {
  CORPORATE_LEGAL_DOC_TYPES,
  type CorporateLegalDocType,
} from "@/lib/legal-management/constants";

export type ComplianceRow = {
  type: CorporateLegalDocType;
  tracked: boolean;
  signed: boolean;
  latestStatus: string | null;
  latestName: string | null;
};

/**
 * Each required type must have at least one row; compliance is satisfied when
 * the most recent document (by createdAt) for that type has status `signed`.
 */
export function buildCorporateComplianceRows(
  documents: { type: string; status: string; name: string; createdAt: Date }[],
): ComplianceRow[] {
  const byType = new Map<CorporateLegalDocType, { type: string; status: string; name: string; createdAt: Date }>();
  for (const d of documents) {
    if (!CORPORATE_LEGAL_DOC_TYPES.includes(d.type as CorporateLegalDocType)) continue;
    const t = d.type as CorporateLegalDocType;
    const prev = byType.get(t);
    if (!prev || d.createdAt > prev.createdAt) byType.set(t, d);
  }

  return CORPORATE_LEGAL_DOC_TYPES.map((type) => {
    const latest = byType.get(type);
    return {
      type,
      tracked: Boolean(latest),
      signed: latest?.status === "signed",
      latestStatus: latest?.status ?? null,
      latestName: latest?.name ?? null,
    };
  });
}

export function allRequiredCorporateDocsSigned(rows: ComplianceRow[]): boolean {
  return rows.every((r) => r.tracked && r.signed);
}
