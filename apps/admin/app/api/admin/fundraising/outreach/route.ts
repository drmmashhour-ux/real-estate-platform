import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { logOutreachMessage, trackFollowUp, trackResponse } from "@/src/modules/fundraising/outreach";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(uid))) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = body as {
    investorId?: string;
    action?: string;
    message?: string;
    nextFollowUpAt?: string | null;
  };
  const investorId = typeof b.investorId === "string" ? b.investorId : "";
  const action = typeof b.action === "string" ? b.action : "";
  const message = typeof b.message === "string" ? b.message : "";
  if (!investorId) return Response.json({ error: "investorId required" }, { status: 400 });
  if (!message.trim()) return Response.json({ error: "message required" }, { status: 400 });

  try {
    if (action === "outreach" || action === "message") {
      const row = await logOutreachMessage(investorId, message);
      return Response.json(row);
    }
    if (action === "response") {
      const row = await trackResponse(investorId, message);
      return Response.json(row);
    }
    if (action === "followup" || action === "follow_up") {
      let next: Date | undefined;
      if (b.nextFollowUpAt) {
        const d = new Date(b.nextFollowUpAt);
        if (!Number.isNaN(d.getTime())) next = d;
      }
      const row = await trackFollowUp(investorId, message, next);
      return Response.json(row);
    }
    return Response.json({ error: "action must be outreach | response | followup" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "outreach failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
