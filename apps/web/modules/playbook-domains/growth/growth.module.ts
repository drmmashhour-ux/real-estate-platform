import type { PlaybookDomainModule } from "../shared/domain.types";
import { buildGrowthContext } from "./growth-context.builder";
import { createGrowthExecutionAdapter } from "./growth-execution.adapter";
import { computeGrowthKpiReward } from "./growth-kpi";

const adapter = createGrowthExecutionAdapter();

export const growthDomainModule: PlaybookDomainModule = {
  domain: "GROWTH",
  buildContext: buildGrowthContext,
  computeReward: computeGrowthKpiReward,
  getExecutionAdapter: () => adapter,
  getSafetyRules: () => ({
    blockedActionTypes: ["send_customer_message", "external_sms", "external_whatsapp", "outbound_message"],
    maxRiskScore: 0.85,
  }),
};
