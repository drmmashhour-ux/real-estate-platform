import { NextResponse } from "next/server";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { assertNegotiationDraftAccess } from "@/app/api/negotiation/_access";

const ALLOWED = new Set(["negotiation_draft_copied", "negotiation_draft_applied", "negotiation_draft_rejected"]);

/** Audit-safe client events — no draft body stored, only summary metadata. */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const event = String(body.event ?? "");
  const listingId = String(body.listingId ?? body.propertyId ?? "");
  const documentId = body.documentId != null ? String(body.documentId) : null;
  const draftKind = body.draftKind != null ? String(body.draftKind) : undefined;

  if (!ALLOWED.has(event)) return NextResponse.json({ error: "invalid event" }, { status: 400 });
  if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const auth = await assertNegotiationDraftAccess({ listingId, documentId });
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  captureServerEvent(auth.userId, event, {
    listingId,
    draftKind: draftKind ?? null,
    at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
