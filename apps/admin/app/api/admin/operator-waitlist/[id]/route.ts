import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { buildOperatorOnboardingUrl } from "@/lib/operator-waitlist";
import { recordPlatformEvent } from "@/lib/observability";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const userId = await getGuestId();
  if (!userId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (u?.role !== "ADMIN") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { userId };
}

/**
 * PATCH /api/admin/operator-waitlist/[id]
 * Body: { action: "approve" | "reject" | "prioritize", priority?: number }
 */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  let body: { action?: string; priority?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action;
  if (action !== "approve" && action !== "reject" && action !== "prioritize") {
    return NextResponse.json(
      { error: "action must be approve, reject, or prioritize" },
      { status: 400 }
    );
  }

  const row = await prisma.operatorWaitlist.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();

  if (action === "reject") {
    await prisma.operatorWaitlist.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedAt: now,
      },
    });
    void recordPlatformEvent({
      eventType: "operator_waitlist_rejected",
      sourceModule: "admin/operator-waitlist",
      entityType: "OperatorWaitlist",
      entityId: id,
      payload: {},
    }).catch(() => {});
    return NextResponse.json({ ok: true, status: "REJECTED" });
  }

  if (action === "prioritize") {
    const next =
      typeof body.priority === "number" && Number.isFinite(body.priority)
        ? Math.round(body.priority)
        : Date.now();
    await prisma.operatorWaitlist.update({
      where: { id },
      data: { priority: next },
    });
    return NextResponse.json({ ok: true, priority: next });
  }

  // approve
  const onboardingUrl = buildOperatorOnboardingUrl();
  await prisma.operatorWaitlist.update({
    where: { id },
    data: {
      status: "APPROVED",
      reviewedAt: now,
      onboardingSentAt: now,
    },
  });

  void recordPlatformEvent({
    eventType: "operator_waitlist_approved",
    sourceModule: "admin/operator-waitlist",
    entityType: "OperatorWaitlist",
    entityId: id,
    payload: { email: row.email },
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    status: "APPROVED",
    onboardingUrl,
    message: "Share this link with the operator to complete onboarding.",
  });
}
