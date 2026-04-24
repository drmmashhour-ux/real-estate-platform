import { NextRequest, NextResponse } from "next/server";
import { authorizePlaybookMemoryApi } from "@/modules/playbook-memory/api/playbook-memory-authorize";
import { playbookMemoryAssignmentService } from "@/modules/playbook-memory/services/playbook-memory-assignment.service";
import type { PlaybookBanditContext } from "@/modules/playbook-memory/types/playbook-memory.types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DOMAINS = new Set<PlaybookBanditContext["domain"]>([
  "GROWTH",
  "PRICING",
  "LEADS",
  "DEALS",
  "LISTINGS",
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
  const ctx: PlaybookBanditContext = {
    ...raw,
    ...(typeof b.explorationRate === "number" && Number.isFinite(b.explorationRate)
      ? { explorationRate: b.explorationRate }
      : {}),
    ...(Array.isArray(b.candidatePlaybookIds)
      ? { candidatePlaybookIds: b.candidatePlaybookIds.map((x) => String(x)).filter(Boolean) }
      : {}),
  };

  try {
    const a = await playbookMemoryAssignmentService.assignBestPlaybook(ctx);
    if (a == null) {
      return NextResponse.json({ ok: true, assignment: null as null });
    }
    return NextResponse.json({ ok: true, assignment: a });
  } catch {
    return NextResponse.json({ ok: true, assignment: null as null });
  }
}
