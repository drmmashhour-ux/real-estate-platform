import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { requireBrokerOrAdminTransactionSession } from "@/lib/transactions/require-sd-transaction-session";
import { acceptInvite } from "@/modules/growth/broker-acquisition.service";

export const dynamic = "force-dynamic";

/** Authenticated broker accepts invite (email must match invite row). GET for link-in-email quick open. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim() ?? "";
  if (!token) return NextResponse.json({ error: "token query required" }, { status: 400 });

  const auth = await requireBrokerOrAdminTransactionSession();
  if (!auth.ok) return auth.response;

  try {
    const invite = await acceptInvite({ token, userId: auth.userId });
    return NextResponse.json({
      ok: true,
      status: invite.status,
      inviteId: invite.id,
      email: invite.email,
    });
  } catch (e) {
    logError("[broker-invite.accept.get]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireBrokerOrAdminTransactionSession();
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  try {
    const invite = await acceptInvite({ token, userId: auth.userId });
    return NextResponse.json({
      ok: true,
      status: invite.status,
      inviteId: invite.id,
      email: invite.email,
    });
  } catch (e) {
    logError("[broker-invite.accept]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
