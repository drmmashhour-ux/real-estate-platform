import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { recordTrustClientEvent, type TrustAuditAction } from "@/lib/trust/trust-audit";

const bodySchema = z.object({
  action: z.enum(["trust_badge_displayed", "trust_oaciq_verify_click"]),
  brokerUserId: z.string().uuid().optional().nullable(),
  listingId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
  surface: z.enum(["listing", "profile", "deal", "contract", "investor_packet", "other"]),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const viewerUserId = await getGuestId();
  const action = parsed.data.action as TrustAuditAction;
  void recordTrustClientEvent({
    action,
    brokerUserId: parsed.data.brokerUserId,
    listingId: parsed.data.listingId,
    dealId: parsed.data.dealId,
    surface: parsed.data.surface,
    viewerUserId,
  });
  return NextResponse.json({ ok: true });
}
