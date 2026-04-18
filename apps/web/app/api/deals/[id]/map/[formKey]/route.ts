import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { loadDealForMapper } from "@/lib/oaciq/load-deal-for-mapper";
import { requireOaciqFormMapper } from "@/lib/oaciq/guard";
import { logBridgeAudit } from "@/modules/execution-bridge/bridge-audit.service";
import { mapFormByKey } from "@/modules/oaciq-mapper/map-form-router";
import { buildCanonicalDealShape, type CanonicalDealShape } from "@/modules/oaciq-mapper/source-paths/canonical-deal-shape";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string; formKey: string }> }) {
  const { id: dealId, formKey } = await context.params;
  const blocked = requireOaciqFormMapper(formKey);
  if (blocked) return blocked;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const deal = await loadDealForMapper(dealId);
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const canonical = buildCanonicalDealShape(deal);
  const map = mapFormByKey(formKey, canonical);
  void logBridgeAudit({
    dealId,
    actorUserId: auth.userId,
    action: "oaciq_map_run",
    payload: { formKey: map.formKey, mode: "get" },
  });

  return Response.json({
    map,
    canonicalDeal: canonical.deal,
    draftNotice: map.draftNotice,
    specimenDisclaimer: "Mapped values are draft assistance — verify against source documents and official forms.",
  });
}

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
  const map = mapFormByKey(formKey, canonical);
  void logBridgeAudit({
    dealId,
    actorUserId: auth.userId,
    action: "oaciq_map_run",
    payload: { formKey: map.formKey, mode: "post", hadOverlay: Boolean(overlay) },
  });

  return Response.json({
    map,
    canonicalDeal: canonical.deal,
    draftNotice: map.draftNotice,
    specimenDisclaimer: "Mapped values are draft assistance — verify against source documents and official forms.",
  });
}
