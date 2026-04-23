import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * GET — lightweight daily-style legal risk summary for admins (deterministic; extend with AI later).
 */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [views, messages, bookings, contactClicks, openPlatformDisputes, openBnhubDisputes] = await Promise.all([
    prisma.immoContactLog.count({ where: { contactType: "VIEW", createdAt: { gte: since } } }),
    prisma.immoContactLog.count({ where: { contactType: "MESSAGE", createdAt: { gte: since } } }),
    prisma.immoContactLog.count({ where: { contactType: "BOOKING_REQUEST", createdAt: { gte: since } } }),
    prisma.immoContactLog.count({ where: { contactType: "CONTACT_CLICK", createdAt: { gte: since } } }),
    prisma.platformLegalDispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }).catch(() => 0),
    prisma.dispute
      .count({
        where: {
          status: {
            in: [
              "OPEN",
              "SUBMITTED",
              "UNDER_REVIEW",
              "WAITING_FOR_HOST_RESPONSE",
              "EVIDENCE_REVIEW",
              "ESCALATED",
            ],
          },
        },
      })
      .catch(() => 0),
  ]);

  let disputes = 0;
  try {
    disputes = await prisma.trustSafetyIncident.count({ where: { createdAt: { gte: since } } });
  } catch {
    disputes = 0;
  }

  const summary = [
    `Last 24h — ImmoContact: views ${views}, contact clicks ${contactClicks}, messages ${messages}, booking requests ${bookings}.`,
    `Open legal/dispute queue (platform + BNHUB booking): ${openPlatformDisputes + openBnhubDisputes} open case(s) — review /admin/disputes.`,
    disputes > 0
      ? `Trust & safety incidents opened: ${disputes} — review /admin/moderation.`
      : "No new trust & safety incidents in the last 24h (snapshot).",
    "Missing documents and blocked publications are tracked per listing flow; reconcile with /admin/contracts and seller/host hubs.",
    "ImmoContact entries are append-only except admin notes; logs support audit but do not replace counsel.",
  ].join(" ");

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    windowHours: 24,
    metrics: {
      views,
      messages,
      bookings,
      contactClicks,
      trustSafetyIncidents24h: disputes,
      openPlatformDisputes,
      openBnhubDisputes,
    },
    summary,
    aiDisclaimer:
      "This summary is rule-based (legal ops snapshot). Connect an AI model for narrative risk analysis when ready; it does not provide legal advice.",
  });
}
