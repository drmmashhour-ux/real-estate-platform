import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, email: true },
  });
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
  const code = u?.referralCode?.trim() || "";
  const referralUrl = code && base ? `${base}/auth/register?ref=${encodeURIComponent(code)}` : base ? `${base}/auth/register` : "";

  return NextResponse.json({
    referralCode: code || null,
    referralUrl,
    shareMessage: code
      ? `Join me on LECIPM — ${referralUrl}`
      : "Complete your profile to get a referral link.",
  });
}
