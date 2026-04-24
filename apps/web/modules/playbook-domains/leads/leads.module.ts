import type { PlaybookDomainModule } from "../shared/domain.types";
import { buildLeadsContext } from "./leads-context.builder";
import { createLeadsExecutionAdapter } from "./leads-execution.adapter";
import { computeLeadsKpiReward } from "./leads-kpi";

const adapter = createLeadsExecutionAdapter();

export const leadsDomainModule: PlaybookDomainModule = {
  domain: "LEADS",
  buildContext: buildLeadsContext,
  computeReward: computeLeadsKpiReward,
  getExecutionAdapter: () => adapter,
  getSafetyRules: () => ({
    blockedActionTypes: ["auto_call", "external_sms", "auto_send_email", "outbound_listing_blast"],
    maxRiskScore: 0.8,
  }),
};
