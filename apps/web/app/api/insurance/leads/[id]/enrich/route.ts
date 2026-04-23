import { prisma } from "@repo/db";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getClientIpFromRequest } from "@/lib/insurance/client-ip";
import { scoreInsuranceLead } from "@/lib/insurance/score-lead";
import { calculateLeadValue } from "@/lib/insurance/pricing";

export const dynamic = "force-dynamic";

/**
 * Optional post-submit phone capture. Public but requires matching email + rate limit.
 */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const ip = getClientIpFromRequest(request);
  const rl = checkRateLimit(`insurance-enrich:${ip}`, { windowMs: 60_000, max: 40 });
  if (!rl.allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429, headers: getRateLimitHeaders(rl) });
  }

  const { id } = await context.params;
  let body: { email?: string; phone?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!email || !phone) {
    return Response.json({ error: "email and phone are required" }, { status: 400 });
  }

  const lead = await prisma.insuranceLead.findUnique({
    where: { id },
    include: { partner: true },
  });
  if (!lead || lead.email !== email) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const nextScore = scoreInsuranceLead({
    phone,
    bookingId: lead.bookingId,
    source: lead.source,
    leadType: lead.leadType,
    listingId: lead.listingId,
  });
  const estimatedValue = calculateLeadValue(
    { phone, bookingId: lead.bookingId, source: lead.source, leadType: lead.leadType, listingId: lead.listingId, leadScore: nextScore },
    lead.partner
  );

  await prisma.insuranceLead.update({
    where: { id },
    data: {
      phone,
      leadScore: nextScore,
      estimatedValue,
    },
  });

  return Response.json({ ok: true }, { headers: getRateLimitHeaders(rl) });
}
