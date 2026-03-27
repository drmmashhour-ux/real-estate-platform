import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";

export async function requireGrowthAutomationAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; response: NextResponse }
> {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, userId };
}
