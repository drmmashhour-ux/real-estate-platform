import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { ingestWebhookLead } from "@/src/modules/bnhub-growth-engine/automations/autopilotEngine";

export const dynamic = "force-dynamic";

function verifyMetaSignature(body: string, signature: string | null, secret: string | undefined): boolean {
  if (!secret || !signature?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const got = signature.slice(7);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(got, "hex");
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Meta lead ads webhook — verify when META_APP_SECRET set; otherwise 501 with clear message. */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const secret = process.env.META_APP_SECRET;
  const sig = request.headers.get("x-hub-signature-256");
  if (secret) {
    if (!verifyMetaSignature(raw, sig, secret)) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else {
    // Development / pre-setup: accept only with explicit header (never production)
    if (process.env.NODE_ENV === "production") {
      return Response.json(
        { error: "META_APP_SECRET not configured — webhook disabled in production" },
        { status: 501 }
      );
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const lead = await ingestWebhookLead({
    sourceType: "META_LEAD",
    sourceConnectorCode: "meta_ads",
    externalLeadRef: typeof payload.leadgen_id === "string" ? payload.leadgen_id : undefined,
    fullName: typeof payload.full_name === "string" ? payload.full_name : null,
    email: typeof payload.email === "string" ? payload.email : null,
    phone: typeof payload.phone_number === "string" ? payload.phone_number : null,
    message: JSON.stringify(payload).slice(0, 2000),
  });

  return Response.json({ ok: true, leadId: lead.id, note: secret ? "verified" : "dev mode — no signature secret" });
}
