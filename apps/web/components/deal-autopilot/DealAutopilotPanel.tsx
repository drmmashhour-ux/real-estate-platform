import type { DealAutopilotSnapshot } from "@/modules/deal-autopilot/deal-autopilot.types";
import { BrokerActionQueue } from "./BrokerActionQueue";
import { BlockerSummaryPanel } from "./BlockerSummaryPanel";
import { ClosingReadinessPanel } from "./ClosingReadinessPanel";
import { DealHealthBadge } from "./DealHealthBadge";

export function DealAutopilotPanel({ snapshot }: { snapshot: DealAutopilotSnapshot }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <DealHealthBadge level={snapshot.dealHealth} />
        <span className="text-sm text-ds-text-secondary">
          Stage: <span className="text-ds-text">{snapshot.currentStage}</span>
        </span>
        <span className="text-xs text-ds-text-secondary">Confidence {Math.round(snapshot.confidence * 100)}%</span>
      </div>
      <p className="text-xs text-ds-text-secondary">{snapshot.disclaimer}</p>

      <section>
        <h3 className="font-medium text-ds-text">Closing readiness</h3>
        <div className="mt-3">
          <ClosingReadinessPanel
            score={snapshot.closingReadiness.score}
            label={snapshot.closingReadiness.label}
            checklist={snapshot.closingReadiness.checklist}
          />
        </div>
      </section>

      <section>
        <h3 className="font-medium text-ds-text">Blockers</h3>
        <div className="mt-3">
          <BlockerSummaryPanel blockers={snapshot.blockers} />
        </div>
      </section>

      <section>
        <h3 className="font-medium text-ds-text">Next best actions</h3>
        <div className="mt-3">
          <BrokerActionQueue actions={snapshot.nextBestActions} />
        </div>
      </section>
    </div>
  );
}
