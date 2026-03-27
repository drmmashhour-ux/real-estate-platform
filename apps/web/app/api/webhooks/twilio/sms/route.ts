import { NextRequest } from "next/server";
import { handleInboundSms } from "@/lib/ai/follow-up/process-jobs";

export const dynamic = "force-dynamic";

/**
 * Twilio inbound SMS webhook (configure in Twilio console).
 * Form fields: From, Body, MessageSid
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const from = String(form.get("From") ?? "");
    const body = String(form.get("Body") ?? "");
    const sid = String(form.get("MessageSid") ?? "");
    await handleInboundSms({ from, body, externalId: sid || undefined });
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  } catch (e) {
    console.error("Twilio SMS webhook", e);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  }
}
