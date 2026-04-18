import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { loadDealForMapper } from "@/lib/oaciq/load-deal-for-mapper";
import { requireOaciqExactMapper } from "@/lib/oaciq/guard";
import { validateExactAllForms } from "@/modules/oaciq-mapper/validation/exact-validation.service";
import { buildCanonicalDealShape, type CanonicalDealShape } from "@/modules/oaciq-mapper/source-paths/canonical-deal-shape";
import { logBridgeAudit } from "@/modules/execution-bridge/bridge-audit.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = requireOaciqExactMapper();
  if (blocked) return blocked;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const deal = await loadDealForMapper(dealId);
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  let activeFormKeys = ["PP", "DS", "IV"] as string[];
  let overlay: Partial<CanonicalDealShape["deal"]> | undefined;
  try {
    const body = (await request.json()) as {
      activeFormKeys?: string[];
      canonicalOverlay?: Partial<CanonicalDealShape["deal"]>;
    };
    if (body.activeFormKeys?.length) activeFormKeys = body.activeFormKeys.map((k) => k.toUpperCase());
    overlay = body.canonicalOverlay;
  } catch {
    /* empty body */
  }

  const canonical = buildCanonicalDealShape(deal, overlay);
  const report = validateExactAllForms(deal, canonical, activeFormKeys);

  void logBridgeAudit({
    dealId,
    actorUserId: auth.userId,
    action: "oaciq_validate_run",
    payload: { forms: activeFormKeys, issueCount: Object.keys(report.perForm).length },
  });

  return Response.json({
    ...report,
    draftNotice: "Draft assistance — broker review required for all mapped outputs.",
  });
}
