import { buildCanonicalDealShape } from "@/modules/oaciq-mapper/source-paths/canonical-deal-shape";
import { loadDealForMapper } from "@/lib/oaciq/load-deal-for-mapper";
import { mapFormByKey } from "@/modules/oaciq-mapper/map-form-router";
import { buildConcessionDeltaSummary } from "./integrations/concession-mapper.service";

export async function getPpCpDiff(dealId: string) {
  const deal = await loadDealForMapper(dealId);
  if (!deal) return null;
  const canonical = buildCanonicalDealShape(deal);
  const pp = mapFormByKey("PP", canonical);
  const cp = mapFormByKey("CP", canonical);
  const delta = buildConcessionDeltaSummary({
    ppFields: pp.mappedFields as Record<string, unknown>,
    cpFields: cp.mappedFields as Record<string, unknown>,
  });
  return {
    ppFieldCount: Object.keys(pp.mappedFields).length,
    cpFieldCount: Object.keys(cp.mappedFields).length,
    changedKeys: delta.changedKeys.slice(0, 120),
    disclaimer: "Diff is mapper-level — compare to official OACIQ instruments filed for the transaction.",
  };
}
