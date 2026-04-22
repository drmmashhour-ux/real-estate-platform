import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { sendInvite } from "@/modules/growth/broker-acquisition.service";

export const dynamic = "force-dynamic";

/** Admin-only — issue Québec-first broker invites (early access program). */
export async function POST(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  try {
    const result = await sendInvite({ email, invitedByUserId: auth.userId });
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_ORIGIN?.trim() || "";
    const acceptUrl =
      baseUrl ?
        `${baseUrl.replace(/\/$/, "")}/api/growth/broker-invite/accept?token=${encodeURIComponent(result.token)}`
      : null;

    return NextResponse.json({
      inviteId: result.invite.id,
      token: result.token,
      acceptUrlHint: acceptUrl,
      email: result.invite.email,
      alreadyPending: result.alreadyPending ?? false,
    });
  } catch (e) {
    logError("[broker-invite]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
