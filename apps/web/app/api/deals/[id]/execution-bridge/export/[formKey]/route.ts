import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { loadDealForMapper } from "@/lib/oaciq/load-deal-for-mapper";
import { requireOaciqExecutionBridge, requireOaciqFormMapper } from "@/lib/oaciq/guard";
import { exportThroughBridge } from "@/modules/execution-bridge/execution-bridge.service";
import type { ExecutionBridgeExportPayload } from "@/modules/execution-bridge/execution-bridge.types";
import { mapFormByKey } from "@/modules/oaciq-mapper/map-form-router";
import { buildCanonicalDealShape, type CanonicalDealShape } from "@/modules/oaciq-mapper/source-paths/canonical-deal-shape";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string; formKey: string }> }) {
  const bridgeBlocked = requireOaciqExecutionBridge();
  if (bridgeBlocked) return bridgeBlocked;
  const { id: dealId, formKey } = await context.params;
  const mapperBlocked = requireOaciqFormMapper(formKey);
  if (mapperBlocked) return mapperBlocked;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const deal = await loadDealForMapper(dealId);
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  type Body = {
    canonicalOverlay?: Partial<CanonicalDealShape["deal"]>;
    brokerApprovalState?: ExecutionBridgeExportPayload["brokerApprovalState"];
    providerMode?: "null" | "pdf_placeholder" | "broker_manual";
    sourceDocumentRefs?: string[];
  };

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const canonical = buildCanonicalDealShape(deal, body.canonicalOverlay);
  const map = mapFormByKey(formKey, canonical);

  const result = await exportThroughBridge({
    dealId,
    formKey,
    map,
    actorUserId: auth.userId,
    providerMode: body.providerMode ?? "broker_manual",
    brokerApprovalState: body.brokerApprovalState ?? "draft",
    sourceDocumentRefs: body.sourceDocumentRefs ?? [],
    providerConnected: false,
  });

  return Response.json({
    export: result.payload,
    providerMessage: result.providerMessage,
    draftNotice: "Export payload is for broker-controlled transfer — not automatic legal execution.",
  });
}
