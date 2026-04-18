import { NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { verifyCronBearer } from "@/lib/server/internal-cron-auth";
import { activateFeaturedPlacement, type FeaturedListingKind } from "@/src/modules/featured/featured-activation.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/featured/activate — admin session or `Authorization: Bearer CRON_SECRET`.
 * Body: { listingKind: "fsbo" | "bnhub", listingId, durationDays?, priority?, source? }
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    listingKind?: FeaturedListingKind;
    listingId?: string;
    durationDays?: number;
    priority?: number;
    source?: string;
  };

  const listingKind = body.listingKind === "bnhub" ? "bnhub" : body.listingKind === "fsbo" ? "fsbo" : null;
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (!listingKind || !listingId) {
    return Response.json({ error: "listingKind (fsbo|bnhub) and listingId required" }, { status: 400 });
  }

  const durationDays = typeof body.durationDays === "number" && body.durationDays > 0 ? body.durationDays : 30;
  const priority = typeof body.priority === "number" ? body.priority : 0;
  const source = typeof body.source === "string" && body.source.trim() ? body.source.trim() : "admin_api";

  let activatedByUserId: string | null = null;

  if (process.env.CRON_SECRET?.trim() && verifyCronBearer(request)) {
    activatedByUserId = null;
  } else {
    const admin = await requireAdminSession();
    if (!admin.ok) {
      return Response.json({ error: admin.error }, { status: admin.status });
    }
    activatedByUserId = admin.userId;
  }

  const out = await activateFeaturedPlacement({
    listingKind,
    listingId,
    durationDays,
    priority,
    source,
    activatedByUserId,
  });

  if (!out.ok) {
    return Response.json({ error: out.error }, { status: 400 });
  }

  return Response.json({
    ok: true,
    mode: out.mode,
    endAt: out.endAt,
    note:
      out.mode === "bnhub_audit"
        ? "BNHub: audit row only; use promotion checkout or wire listing featured window in a follow-up."
        : undefined,
  });
}
