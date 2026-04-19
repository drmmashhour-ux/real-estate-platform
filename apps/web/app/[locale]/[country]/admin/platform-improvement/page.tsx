import Link from "next/link";
import { opsAssistantApprovalFlags, platformImprovementFlags } from "@/config/feature-flags";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { PlatformImprovementFeatureDisabled } from "@/components/platform/PlatformImprovementFeatureDisabled";
import { PlatformImprovementPanel } from "@/components/platform/PlatformImprovementPanel";
import { buildWeeklyFocusList } from "@/modules/platform/platform-improvement-priority.service";
import {
  buildExecutionPanelModel,
  listRecentHistory,
  statusesByPriorityIdFromDoc,
  syncExecutionStateWithBundle,
} from "@/modules/platform/platform-improvement-state.service";
import { buildFullPlatformImprovementBundle } from "@/modules/platform/platform-improvement-review.service";
import {
  listExecutionRequests,
  listRecentApprovalAudit,
} from "@/modules/platform/ops-assistant/approval-execution.service";
import { buildApprovalExecutionOutcomeSummary } from "@/modules/platform/ops-assistant/approval-execution-results.service";
import { prepareGovernanceReviewState } from "@/modules/platform/ops-assistant/approval-execution-review.service";
import { listFutureReviewCandidates } from "@/modules/platform/ops-assistant/future-review-candidate.service";
import { listProposals } from "@/modules/platform/ops-assistant/future-low-risk-proposal.service";
import { recordOpsAssistantSuggestionsShown } from "@/modules/platform/ops-assistant/ops-assistant-monitoring.service";
import { buildOpsAssistantMapByPriorityId } from "@/modules/platform/ops-assistant/ops-assistant.service";

export const dynamic = "force-dynamic";

export default async function AdminPlatformImprovementPage() {
  await requireAdminControlUserId();

  if (!platformImprovementFlags.platformImprovementReviewV1) {
    return <PlatformImprovementFeatureDisabled />;
  }

  const bundle = buildFullPlatformImprovementBundle();
  syncExecutionStateWithBundle(bundle);
  const execution = buildExecutionPanelModel(bundle);
  const weeklyFocus = buildWeeklyFocusList(bundle.priorities, statusesByPriorityIdFromDoc());
  const recentHistory = listRecentHistory(14);
  const statuses = statusesByPriorityIdFromDoc();
  const opsAssistantByPriorityId = buildOpsAssistantMapByPriorityId(bundle.priorities, statuses);
  const approvalVisible =
    opsAssistantApprovalFlags.opsAssistantApprovalPanelV1 ||
    opsAssistantApprovalFlags.opsAssistantApprovalExecutionV1;

  const approvalExecutionResults = approvalVisible ? buildApprovalExecutionOutcomeSummary() : null;
  const governanceReview =
    approvalVisible && approvalExecutionResults
      ? prepareGovernanceReviewState(approvalExecutionResults)
      : undefined;

  recordOpsAssistantSuggestionsShown(
    Object.values(opsAssistantByPriorityId).reduce((acc, list) => acc + list.length, 0),
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/admin/overview" className="text-sm text-amber-400 hover:text-amber-300">
          ← Control tower overview
        </Link>
        <div className="mt-6">
          <PlatformImprovementPanel
            bundle={bundle}
            execution={execution}
            weeklyFocus={weeklyFocus}
            recentHistory={recentHistory}
            opsAssistantByPriorityId={opsAssistantByPriorityId}
            approvalQueue={
              approvalVisible
                ? {
                    show: true,
                    requests: listExecutionRequests(),
                    audit: listRecentApprovalAudit(80),
                    killSwitch: opsAssistantApprovalFlags.opsAssistantApprovalKillSwitch,
                    mutationsEnabled:
                      opsAssistantApprovalFlags.opsAssistantApprovalExecutionV1 &&
                      !opsAssistantApprovalFlags.opsAssistantApprovalKillSwitch,
                  }
                : undefined
            }
            approvalExecutionResults={approvalExecutionResults}
            governanceReview={
              governanceReview && approvalExecutionResults
                ? {
                    outcomeSummary: approvalExecutionResults,
                    records: governanceReview.records,
                    reviewSummary: governanceReview.summary,
                    mutationsEnabled:
                      opsAssistantApprovalFlags.opsAssistantApprovalExecutionV1 &&
                      !opsAssistantApprovalFlags.opsAssistantApprovalKillSwitch,
                  }
                : undefined
            }
            futureLowRiskProposals={
              approvalVisible
                ? {
                    initialProposals: listProposals({ includeArchived: false }),
                    mutationsEnabled:
                      opsAssistantApprovalFlags.opsAssistantApprovalExecutionV1 &&
                      !opsAssistantApprovalFlags.opsAssistantApprovalKillSwitch,
                  }
                : undefined
            }
            futureReviewCandidates={
              approvalVisible
                ? {
                    initialCandidates: listFutureReviewCandidates({ includeArchived: false }),
                    mutationsEnabled:
                      opsAssistantApprovalFlags.opsAssistantApprovalExecutionV1 &&
                      !opsAssistantApprovalFlags.opsAssistantApprovalKillSwitch,
                  }
                : undefined
            }
            opsAssistantApproval={{
              executionEnabled: opsAssistantApprovalFlags.opsAssistantApprovalExecutionV1,
              panelEnabled: opsAssistantApprovalFlags.opsAssistantApprovalPanelV1,
              killSwitch: opsAssistantApprovalFlags.opsAssistantApprovalKillSwitch,
            }}
          />
        </div>
      </div>
    </main>
  );
}
