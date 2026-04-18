import type { DealReviewSurfacePayload } from "@/modules/qa-review/review-surface.service";
import { ComplianceStatusBadge } from "./ComplianceStatusBadge";
import { QAOutcomeSummary } from "./QAOutcomeSummary";
import { ReviewRequiredBanner } from "./ReviewRequiredBanner";
import { SupervisorNotePanel } from "./SupervisorNotePanel";

export function DealReviewSurfaceSection({ surface }: { surface: DealReviewSurfacePayload }) {
  if (!surface.enabled || !surface.visible) {
    return null;
  }

  const isAdminNotes = surface.supervisorNotes && surface.supervisorNotes.length > 0;

  return (
    <section className="mt-6 space-y-4 rounded-xl border border-amber-500/20 bg-gradient-to-br from-zinc-950 to-black p-4 text-zinc-100 shadow-lg shadow-black/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-amber-100/95">Brokerage QA &amp; compliance (internal)</h2>
          <p className="mt-1 text-xs text-zinc-500">{surface.disclaimer}</p>
        </div>
        <ComplianceStatusBadge
          openCases={surface.complianceSummary.openInternalCases}
          escalatedAttention={surface.complianceSummary.hasEscalatedOrCriticalAttention}
        />
      </div>

      <ReviewRequiredBanner qaSummary={surface.qaSummary} />
      <QAOutcomeSummary qaSummary={surface.qaSummary} />

      {isAdminNotes ? <SupervisorNotePanel notes={surface.supervisorNotes!} /> : null}
    </section>
  );
}
