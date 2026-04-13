import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { listSocialAccountsSafe } from "@/lib/content-automation/social-accounts";

export const dynamic = "force-dynamic";

/** List connected social accounts for the current admin (no raw tokens). */
export async function GET() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const accounts = await listSocialAccountsSafe(userId);
  return NextResponse.json({ accounts });
}
