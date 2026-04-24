import { NextResponse } from "next/server";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { computeDealPlaybookView } from "@/modules/deal-execution-playbook/deal-playbook-engine.service";
import { syncDealPlaybookRecord } from "@/modules/deal-execution-playbook/deal-playbook-sync.service";

export const dynamic = "force-dynamic";

/**
 * GET — first-deals execution playbook (computed from deal signals + persisted snapshot).
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;
  if (auth.deal.brokerId !== auth.userId && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Assignee broker only" }, { status: 403 });
  }

  const view = await computeDealPlaybookView(dealId);
  if (!view) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await syncDealPlaybookRecord(dealId, view);

  return NextResponse.json({
    ok: true,
    playbook: {
      dealId: view.dealId,
      currentStep: view.currentStep,
      currentStepMeta: view.currentStepMeta,
      completedSteps: view.completedSteps,
      nextAction: view.nextAction,
      progressPercent: view.progressPercent,
      steps: view.steps,
      checklist: view.checklist,
      aiSuggestions: view.aiSuggestions,
      reminders: view.reminders,
      timelineHints: view.timelineHints,
      documentHints: view.documentHints,
      delays: view.delays,
      riskFlags: view.riskFlags,
    },
  });
}
