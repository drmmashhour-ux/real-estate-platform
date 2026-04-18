import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { loadDealForMapper } from "@/lib/oaciq/load-deal-for-mapper";
import { requireOaciqFormMapper } from "@/lib/oaciq/guard";
import { mapFormByKey } from "@/modules/oaciq-mapper/map-form-router";
import { buildPreviewByKey } from "@/modules/oaciq-mapper/preview/preview-engine";
import { buildCanonicalDealShape } from "@/modules/oaciq-mapper/source-paths/canonical-deal-shape";

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
  const preview = buildPreviewByKey(formKey, map);

  return Response.json({
    preview,
    previewDisclaimer:
      "Broker-reviewable draft preview — preserves section order for clarity; not an official execution document.",
  });
}
