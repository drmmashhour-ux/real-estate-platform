import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { logTimelineEvent } from "@/lib/timeline/log-event";
import { runMarketplaceAutonomy } from "@/modules/autonomy/darlink-execution-orchestrator.service";

export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as {
      listingId?: string | null;
      portfolio?: boolean;
      dryRun?: boolean;
    };
    const result = await runMarketplaceAutonomy({
      listingId: body.listingId ?? undefined,
      portfolio: body.portfolio !== false,
      dryRun: body.dryRun !== false,
      actorUserId: admin.id,
    });
    void logTimelineEvent({
      entityType: body.listingId?.trim() ? "syria_property" : "marketplace_autonomy",
      entityId: body.listingId?.trim() || "portfolio",
      action: result.ok ? "marketplace_autonomy_completed" : "marketplace_autonomy_conflict_or_failure",
      actorId: admin.id,
      actorRole: "admin",
      metadata: {
        portfolio: body.portfolio !== false,
        dryRun: body.dryRun !== false,
        ok: result.ok,
      },
    });
    return NextResponse.json({ ok: result.ok, result });
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
}
