import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { prisma } from "@repo/db";
import { getComplianceStatus } from "@/services/compliance/coownershipCompliance.service";

export const dynamic = "force-dynamic";

type DecisionPayload = {
  decision?: {
    actions?: Array<{ type: string; payload?: { message?: string; reason?: string } }>;
  };
};

/**
 * GET — last LECIPM co-ownership autopilot decision + live compliance progress (for listing edit “Autopilot” card).
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { id: listingId } = await ctx.params;
  const ok = await canAccessCrmListingCompliance(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [status, last] = await Promise.all([
    getComplianceStatus(listingId),
    prisma.lecipmCoreAutopilotAction.findFirst({
      where: {
        targetType: "listing",
        targetId: listingId,
        domain: "COOWNERSHIP_COMPLIANCE",
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        severity: true,
        description: true,
        createdAt: true,
        payloadJson: true,
      },
    }),
  ]);

  const required = status.items.filter((i) => i.required);
  const done = required.filter((i) => i.status === "COMPLETED").length;
  const total = required.length;
  const progressPct = !status.applies || total === 0 ? 100 : Math.round((done / total) * 100);

  const raw = (last?.payloadJson ?? null) as DecisionPayload | null;
  const fromDecision = raw?.decision?.actions?.find((a) => a.type === "RECOMMENDATION");
  const recommendationMessage =
    typeof fromDecision?.payload?.message === "string"
      ? fromDecision.payload.message
      : "Request the co-ownership certificate immediately to avoid delays and ensure compliance.";

  return NextResponse.json({
    applies: status.applies,
    progressPct,
    certificateComplete: status.certificateComplete,
    complete: status.complete,
    recommendationMessage,
    lastAutopilot: last
      ? {
          id: last.id,
          severity: last.severity,
          description: last.description,
          createdAt: last.createdAt.toISOString(),
        }
      : null,
  });
}
