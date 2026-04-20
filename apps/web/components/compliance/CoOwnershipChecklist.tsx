"use client";

import {
  CoOwnershipCompliancePanel,
  type CoOwnershipCompliancePayload,
} from "./CoOwnershipCompliancePanel";

export type { CoOwnershipCompliancePayload };

/** @deprecated Prefer `CoOwnershipCompliancePanel`; extra props retained for backwards compatibility */
type Props = Parameters<typeof CoOwnershipCompliancePanel>[0] & {
  showRegulationBanner?: boolean;
  showAiRecommendation?: boolean;
};

/** Broker CRM unified co-ownership + insurance checklist (delegates to `CoOwnershipCompliancePanel`). */
export function CoOwnershipChecklist(props: Props) {
  const { showRegulationBanner: _sb, showAiRecommendation: _sa, ...rest } = props;
  return <CoOwnershipCompliancePanel {...rest} />;
}

export { CoOwnershipCompliancePanel };
