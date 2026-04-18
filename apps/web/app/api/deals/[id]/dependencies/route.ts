import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { loadDealForMapper } from "@/lib/oaciq/load-deal-for-mapper";
import { requireOaciqExactMapper } from "@/lib/oaciq/guard";
import { runDependencyEngine } from "@/modules/oaciq-mapper/dependencies/dependency-engine";
import { buildCanonicalDealShape } from "@/modules/oaciq-mapper/source-paths/canonical-deal-shape";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = requireOaciqExactMapper();
  if (blocked) return blocked;
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const deal = await loadDealForMapper(dealId);
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("forms") ?? "PP";
  const activeFormKeys = raw.split(",").map((s) => s.trim()).filter(Boolean);

  const canonical = buildCanonicalDealShape(deal);
  const result = runDependencyEngine(deal, canonical, activeFormKeys);

  return Response.json({
    ...result,
    disclaimer: "Suggested form relationships for workflow review — not regulatory advice.",
  });
}
