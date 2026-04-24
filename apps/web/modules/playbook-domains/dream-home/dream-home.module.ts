import type { PlaybookDomainModule } from "../shared/domain.types";
import { buildDreamHomeContext } from "./dream-home-context.builder";
import { createDreamHomeExecutionAdapter } from "./dream-home-execution.adapter";
import { computeDreamHomeKpiReward } from "./dream-home-kpi";

const adapter = createDreamHomeExecutionAdapter();

export const dreamHomeDomainModule: PlaybookDomainModule = {
  domain: "DREAM_HOME",
  buildContext: buildDreamHomeContext,
  computeReward: computeDreamHomeKpiReward,
  getExecutionAdapter: () => adapter,
  getSafetyRules: () => ({
    blockedActionTypes: [
      "send_message",
      "inferred_trait_signal",
      "external_sms",
      "outbound_contact",
      "send_email",
      "financial_commitment",
      "legal_action",
      "auto_broker_contact",
    ],
    maxRiskScore: 0.78,
  }),
};
