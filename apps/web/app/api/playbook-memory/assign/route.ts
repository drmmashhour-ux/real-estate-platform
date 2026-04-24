import { NextRequest, NextResponse } from "next/server";
import { augmentRecommendationContext } from "@/modules/playbook-domains/augment-recommendation-context";
import { authorizePlaybookMemoryApi } from "@/modules/playbook-memory/api/playbook-memory-authorize";
import { playbookMemoryAssignmentService } from "@/modules/playbook-memory/services/playbook-memory-assignment.service";
import type { PlaybookBanditContext, RecommendationRequestContext } from "@/modules/playbook-memory/types/playbook-memory.types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DOMAINS = new Set<PlaybookBanditContext["domain"]>([
  "GROWTH",
  "PRICING",
  "LEADS",
  "DEALS",
  "LISTINGS",
  "DREAM_HOME",
  "MESSAGING",
  "PROMOTIONS",
  "BOOKINGS",
  "BROKER_ROUTING",
  "RISK",
]);

function isContext(o: unknown): o is PlaybookBanditContext {
  if (o == null || typeof o !== "object" || Array.isArray(o)) return false;
  const c = o as { domain?: unknown; entityType?: unknown };
  return (
    typeof c.entityType === "string" &&
    c.entityType.length > 0 &&
    typeof c.domain === "string" &&
    DOMAINS.has(c.domain as PlaybookBanditContext["domain"])
  );
}

export async function POST(req: NextRequest) {
  if (!(await authorizePlaybookMemoryApi(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true, assignment: null as null });
  }

  const b = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  if (!b) {
    return NextResponse.json({ ok: true, assignment: null as null });
  }
  const raw = b.context !== undefined && b.context !== null ? b.context : b;
  if (!isContext(raw)) {
    return NextResponse.json({ ok: true, assignment: null as null });
  }
  const userId = typeof b.userId === "string" && b.userId.trim() ? b.userId.trim() : undefined;
  const ctx: PlaybookBanditContext = {
    ...raw,
    ...(userId ? { userId } : {}),
    ...(typeof b.explorationRate === "number" && Number.isFinite(b.explorationRate)
      ? { explorationRate: b.explorationRate }
      : {}),
    ...(Array.isArray(b.candidatePlaybookIds)
      ? { candidatePlaybookIds: b.candidatePlaybookIds.map((x) => String(x)).filter(Boolean) }
      : {}),
  };

  try {
    const baseRec: RecommendationRequestContext = {
      domain: ctx.domain,
      entityType: ctx.entityType,
      market: ctx.market,
      segment: ctx.segment,
      signals: ctx.signals,
      policyFlags: ctx.policyFlags,
      autonomyMode: ctx.autonomyMode,
      candidatePlaybookIds: ctx.candidatePlaybookIds,
      userId: ctx.userId,
    };
    const aug = await augmentRecommendationContext(baseRec);
    const enriched: PlaybookBanditContext = {
      ...ctx,
      signals: aug.signals as PlaybookBanditContext["signals"],
      market: aug.market ?? ctx.market,
      segment: aug.segment ?? ctx.segment,
    };
    const a = await playbookMemoryAssignmentService.assignBestPlaybook(enriched);
    if (a == null) {
      return NextResponse.json({ ok: true, assignment: null as null });
    }
    return NextResponse.json({ ok: true, assignment: a });
  } catch {
    return NextResponse.json({ ok: true, assignment: null as null });
  }
}
