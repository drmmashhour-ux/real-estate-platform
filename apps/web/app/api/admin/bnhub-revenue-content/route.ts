import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { generateBnhubDailyContentPack } from "@/lib/bnhub/revenue-content";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const raw = new URL(req.url).searchParams.get("date");
  const forDate = raw ? new Date(raw) : new Date();
  if (Number.isNaN(forDate.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  return NextResponse.json({ pack: generateBnhubDailyContentPack(forDate) });
}
