import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { ingestWebhookLead } from "@/src/modules/bnhub-growth-engine/automations/autopilotEngine";

export const dynamic = "force-dynamic";

function verifyTikTokSignature(bodyRaw: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(bodyRaw).digest("hex");
  const got = signature.replace(/^sha256=/i, "").trim();
  let a: Buffer;
  let b: Buffer;
  try {
    a = Buffer.from(expected, "hex");
    b = Buffer.from(got, "hex");
  } catch {
    return false;
  }
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * TikTok lead webhook — when TIKTOK_WEBHOOK_SECRET is set, signature must verify (hex HMAC-SHA256 of raw body).
 * Replace verifyTikTokSignature with the vendor’s exact algorithm when integrating.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const secret = process.env.TIKTOK_WEBHOOK_SECRET;

  if (secret) {
    const sig = request.headers.get("x-tiktok-signature") ?? request.headers.get("x-signature");
    if (!verifyTikTokSignature(raw, sig, secret)) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return Response.json(
      { error: "TIKTOK_WEBHOOK_SECRET not configured — webhook disabled in production" },
      { status: 501 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const lead = await ingestWebhookLead({
    sourceType: "TIKTOK_LEAD",
    sourceConnectorCode: "tiktok_ads",
    externalLeadRef: typeof body.lead_id === "string" ? body.lead_id : undefined,
    fullName: typeof body.name === "string" ? body.name : null,
    email: typeof body.email === "string" ? body.email : null,
    message: JSON.stringify(body).slice(0, 2000),
  });
  return Response.json({
    ok: true,
    leadId: lead.id,
    note: secret ? "signature checked (customize per TikTok docs)" : "dev mode — no webhook secret",
  });
}
