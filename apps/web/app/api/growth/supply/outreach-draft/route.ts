import { NextResponse } from "next/server";
import { buildSupplyAcquisitionBundle } from "@/modules/supply-acquisition/supply-acquisition.service";
import { buildHostOutreachDraft } from "@/modules/supply-acquisition/host-acquisition.service";
import { buildBrokerRoiPreview } from "@/modules/supply-acquisition/broker-acquisition.service";
import { buildSellerPitchDraft } from "@/modules/supply-acquisition/seller-acquisition.service";
import { requireMontrealGrowthAdmin } from "@/lib/growth/montreal-growth-api-auth";
import { montrealGrowthEngineFlags } from "@/config/feature-flags";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";
import { assertOutreachDraftRateLimit } from "@/lib/growth/montreal-growth-rate-limit";

export const dynamic = "force-dynamic";

type Body = {
  targetIndex?: number;
  kind?: "host" | "broker" | "seller";
};

export async function POST(request: Request) {
  const auth = await requireMontrealGrowthAdmin();
  if (!auth.ok) return auth.response;
  if (!montrealGrowthEngineFlags.supplyAcquisitionV1) {
    return NextResponse.json({ error: "Supply acquisition module disabled" }, { status: 403 });
  }

  const limited = await assertOutreachDraftRateLimit(auth.userId);
  if (limited) return limited;

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const idx = Number.isFinite(body.targetIndex) ? Math.max(0, Math.floor(body.targetIndex!)) : 0;
  const kind = body.kind ?? "host";

  const bundle = await buildSupplyAcquisitionBundle();
  const target = bundle.targets[idx] ?? null;
  if (!target) {
    return NextResponse.json(
      { error: "No acquisition target at this index — refresh market snapshot." },
      { status: 400 }
    );
  }

  let draft: unknown;
  if (kind === "broker") {
    draft = buildBrokerRoiPreview(target);
  } else if (kind === "seller") {
    draft = buildSellerPitchDraft(target);
  } else {
    draft = buildHostOutreachDraft(target);
  }

  await logGrowthEngineAudit({
    actorUserId: auth.userId,
    action: "supply_outreach_draft_generated",
    payload: {
      kind,
      targetIndex: idx,
      neighborhood: target.neighborhood,
      reviewRequired: true,
    },
  });

  return NextResponse.json({
    draft,
    target: {
      neighborhood: target.neighborhood,
      propertyType: target.propertyType,
      priceBand: target.priceBand,
      opportunityScore: target.opportunityScore,
      priority: target.priority,
    },
  });
}
