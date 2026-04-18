import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { loadDealForMapper } from "@/lib/oaciq/load-deal-for-mapper";
import { requireOaciqFormMapper } from "@/lib/oaciq/guard";
import { validateExactForForm } from "@/modules/oaciq-mapper/validation/exact-validation.service";
import { buildCanonicalDealShape, type CanonicalDealShape } from "@/modules/oaciq-mapper/source-paths/canonical-deal-shape";
import { logBridgeAudit } from "@/modules/execution-bridge/bridge-audit.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string; formKey: string }> }) {
  const { id: dealId, formKey } = await context.params;
  const blocked = requireOaciqFormMapper(formKey);
  if (blocked) return blocked;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const deal = await loadDealForMapper(dealId);
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  let overlay: Partial<CanonicalDealShape["deal"]> | undefined;
  try {
    const body = (await request.json()) as { canonicalOverlay?: Partial<CanonicalDealShape["deal"]> };
    overlay = body.canonicalOverlay;
  } catch {
    overlay = undefined;
  }

  const canonical = buildCanonicalDealShape(deal, overlay);
  const report = validateExactForForm(formKey, canonical);

  void logBridgeAudit({
    dealId,
    actorUserId: auth.userId,
    action: "oaciq_validate_run",
    payload: { formKey: report.formKey, issueCount: report.issues.length },
  });

  return Response.json({
    ...report,
    draftNotice: "Draft assistance — broker review required for all mapped outputs.",
  });
}
