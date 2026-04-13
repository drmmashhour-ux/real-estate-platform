import { NextRequest } from "next/server";

export function verifyContentAutomationWebhook(req: NextRequest): boolean {
  const secret = process.env.CONTENT_AUTOMATION_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  const header = req.headers.get("x-webhook-secret") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return header === secret;
}
