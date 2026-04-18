import { buildCanonicalDealShape } from "@/modules/oaciq-mapper/source-paths/canonical-deal-shape";
import { mapFormByKey } from "@/modules/oaciq-mapper/map-form-router";
import { runNegotiationEngine } from "@/modules/negotiation-copilot/negotiation-engine";
import { extractPpNegotiationFields } from "@/modules/negotiation-copilot/integrations/pp-negotiation-linker.service";
import { buildScenariosFromEngineOutputs } from "./pp-cp-scenario-builder.service";
import { mapEngineRisks } from "./negotiation-risk-mapper.service";
import { negotiationAutopilotExplainer } from "./negotiation-autopilot.explainer";
import type { NegotiationAutopilotResult } from "./negotiation-autopilot.types";
import type { Deal, DealParty } from "@prisma/client";

type DealForNeg = Deal & {
  buyer: { name: string | null; email: string | null; phone: string | null; sellerProfileAddress: string | null };
  seller: { name: string | null; email: string | null; phone: string | null; sellerProfileAddress: string | null };
  broker: { name: string | null; email: string | null; phone: string | null } | null;
  dealParties: DealParty[];
};

export function runNegotiationAutopilotCore(deal: DealForNeg): NegotiationAutopilotResult {
  const canonical = buildCanonicalDealShape(deal as Parameters<typeof buildCanonicalDealShape>[0]);
  const ppMap = mapFormByKey("PP", canonical);
  const ppFields = extractPpNegotiationFields(ppMap);
  const { outputs, riskFlags } = runNegotiationEngine({
    ppMap: ppFields,
    deal: canonical,
    daysOnMarket: null,
  });
  const scenarios = buildScenariosFromEngineOutputs(outputs);
  return {
    disclaimer: negotiationAutopilotExplainer(),
    scenarios,
    engineOutputs: outputs,
    riskFlags: mapEngineRisks(outputs),
  };
}
