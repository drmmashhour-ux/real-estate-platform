import { NextRequest } from "next/server";
import type { DisputeStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { resolveDispute } from "@/src/modules/bnhub/application/disputeResolutionService";

export const dynamic = "force-dynamic";

const ALLOWED: DisputeStatus[] = [
  "RESOLVED",
  "RESOLVED_PARTIAL_REFUND",
  "RESOLVED_FULL_REFUND",
  "REJECTED",
  "CLOSED",
];

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: disputeId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    status?: string;
    refundCents?: number;
    resolutionNotes?: string;
  };
  const status = body.status as DisputeStatus | undefined;
  if (!status || !ALLOWED.includes(status)) {
    return Response.json({ error: "Invalid status for resolution" }, { status: 400 });
  }

  try {
    const updated = await resolveDispute({
      disputeId,
      status,
      refundCents: typeof body.refundCents === "number" ? body.refundCents : undefined,
      resolvedBy: userId,
      resolutionNotes: typeof body.resolutionNotes === "string" ? body.resolutionNotes : undefined,
    });
    return Response.json(updated);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
