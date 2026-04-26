import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) return NextResponse.json({ error: "UserId required" }, { status: 400 });

  try {
    const consents = await prisma.privacyConsentRecord.findMany({
      where: { userId, revokedAt: null },
    });

    return NextResponse.json({ consents });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
