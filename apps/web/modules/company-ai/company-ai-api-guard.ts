import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";

export async function requireCompanyAiAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; response: NextResponse }
> {
  const userId = await getGuestId();
  if (!userId) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!(await isPlatformAdmin(userId))) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, userId };
}
