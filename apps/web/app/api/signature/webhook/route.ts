import { verifyDocuSignHmac, verifyPandaDocSharedSecret } from "@/lib/signature/webhook-verify";
import { parseDocuSignConnectPayload } from "@/modules/signature/webhooks/docusign.webhook";
import { parsePandaDocWebhook } from "@/modules/signature/webhooks/pandadoc.webhook";
import { applyDocuSignEvents, applyPandaDocEvents } from "@/modules/signature/webhooks/signature-webhook-handler";

export const dynamic = "force-dynamic";

/**
 * Provider webhooks — verify HMAC / shared secret before applying state updates.
 * Query: ?provider=docusign | pandadoc
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider");
  const raw = await request.text();

  if (provider === "docusign") {
    const sig =
      request.headers.get("x-docusign-signature-1") ??
      request.headers.get("X-DocuSign-Signature-1") ??
      "";
    const ok = verifyDocuSignHmac(raw, sig);
    if (!ok && process.env.NODE_ENV === "production") {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
    let body: unknown;
    try {
      body = JSON.parse(raw || "{}") as unknown;
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const events = parseDocuSignConnectPayload(body);
    const result = await applyDocuSignEvents(events);
    return Response.json({ ok: true, ...result });
  }

  if (provider === "pandadoc") {
    const headerName = process.env.PANDADOC_WEBHOOK_SIGNATURE_HEADER ?? "pandadoc-signature";
    const headerVal = request.headers.get(headerName) ?? request.headers.get(headerName.toLowerCase());
    const ok = verifyPandaDocSharedSecret(headerVal);
    if (!ok && process.env.NODE_ENV === "production") {
      return Response.json({ error: "Invalid webhook secret" }, { status: 401 });
    }
    let body: unknown;
    try {
      body = JSON.parse(raw || "{}") as unknown;
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const events = parsePandaDocWebhook(body);
    const result = await applyPandaDocEvents(events);
    return Response.json({ ok: true, ...result });
  }

  return Response.json({ error: "provider query must be docusign or pandadoc" }, { status: 400 });
}
