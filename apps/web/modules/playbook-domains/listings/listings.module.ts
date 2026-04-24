import type { PlaybookDomainModule } from "../shared/domain.types";
import { buildListingsContext } from "./listings-context.builder";
import { createListingsExecutionAdapter } from "./listings-execution.adapter";
import { computeListingsKpiReward } from "./listings-kpi";

const adapter = createListingsExecutionAdapter();

export const listingsDomainModule: PlaybookDomainModule = {
  domain: "LISTINGS",
  buildContext: buildListingsContext,
  computeReward: computeListingsKpiReward,
  getExecutionAdapter: () => adapter,
  getSafetyRules: () => ({
    blockedActionTypes: ["send_message", "message_user", "external_sms", "outbound_listing_blast"],
    maxRiskScore: 0.8,
  }),
};
