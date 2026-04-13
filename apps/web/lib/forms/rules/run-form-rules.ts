import type { LegalFormSchemaDocument } from "../types";
import type { RuleEngineResult } from "../types";
import { runAnnexRules } from "./annex-rules";
import { runConsistencyRules } from "./consistency-rules";
import { runCustomClauseRules } from "./custom-clause-rules";
import { runFormTypeRules } from "./form-type-rules";
import { runLanguageRules } from "./language-rules";

function collectRequiredMissing(schema: LegalFormSchemaDocument, fieldValues: Record<string, unknown>) {
  const missing: string[] = [];
  for (const sec of schema.sections) {
    for (const f of sec.fields) {
      if (!f.required) continue;
      const v = fieldValues[f.id];
      if (v === undefined || v === null || v === "") {
        missing.push(f.id);
      }
      if (f.type === "boolean" && v === undefined) {
        missing.push(f.id);
      }
    }
  }
  return missing;
}

export function runFormRules(args: {
  schema: LegalFormSchemaDocument;
  draftLanguage: string;
  fieldValues: Record<string, unknown>;
  listingPriceCents?: number | null;
}): RuleEngineResult {
  const missing = collectRequiredMissing(args.schema, args.fieldValues);
  const alerts: RuleEngineResult["alerts"] = [];

  for (const id of missing) {
    alerts.push({
      severity: "blocking",
      alertType: "missing_field",
      title: `Missing required field: ${id}`,
      body: "Complete all required fields before marking the draft ready or exporting.",
      sourceType: "rule_engine",
      sourceRef: "required_fields",
    });
  }

  const offerDate = args.fieldValues.offer_date;
  const acceptanceDate = args.fieldValues.acceptance_deadline;
  if (typeof offerDate === "string" && typeof acceptanceDate === "string") {
    const o = Date.parse(offerDate);
    const a = Date.parse(acceptanceDate);
    if (!Number.isNaN(o) && !Number.isNaN(a) && a < o) {
      alerts.push({
        severity: "blocking",
        alertType: "inconsistency",
        title: "Invalid date order",
        body: "Acceptance deadline cannot be before the offer date.",
        sourceType: "rule_engine",
        sourceRef: "date_order",
      });
    }
  }

  const dep = args.fieldValues.deposit_cents;
  const price = args.fieldValues.purchase_price_cents;
  if (typeof dep === "number" && typeof price === "number" && price > 0 && dep > price) {
    alerts.push({
      severity: "blocking",
      alertType: "inconsistency",
      title: "Invalid amount logic",
      body: "Deposit cannot exceed purchase price.",
      sourceType: "rule_engine",
      sourceRef: "amount_logic",
    });
  }

  const merge = (r: RuleEngineResult) => {
    alerts.push(...r.alerts);
  };

  merge(runFormTypeRules(args.schema, args.fieldValues));
  merge(runLanguageRules(args.schema, args.draftLanguage, args.fieldValues));
  merge(runAnnexRules(args.schema, args.fieldValues));
  merge(runConsistencyRules(args.fieldValues, args.listingPriceCents ?? null));
  merge(runCustomClauseRules(args.fieldValues));

  return {
    alerts,
    details: { missingFieldIds: missing },
  };
}

export function hasBlockingAlerts(alerts: { severity: string }[]): boolean {
  return alerts.some((a) => a.severity === "blocking");
}
