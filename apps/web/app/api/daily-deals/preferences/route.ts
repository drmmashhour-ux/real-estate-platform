import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const preferences = await prisma.userFeedPreference.findUnique({ where: { userId } });
  return NextResponse.json({ preferences });
}

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  const row = await prisma.userFeedPreference.upsert({
    where: { userId },
    create: {
      userId,
      preferredCities: Array.isArray(body?.preferredCities) ? body.preferredCities : [],
      preferredPropertyTypes: Array.isArray(body?.preferredPropertyTypes) ? body.preferredPropertyTypes : [],
      preferredModes: Array.isArray(body?.preferredModes) ? body.preferredModes : [],
      budgetMin: typeof body?.budgetMin === "number" ? body.budgetMin : null,
      budgetMax: typeof body?.budgetMax === "number" ? body.budgetMax : null,
      strategyMode: typeof body?.strategyMode === "string" ? body.strategyMode : null,
      riskTolerance: typeof body?.riskTolerance === "string" ? body.riskTolerance : null,
    },
    update: {
      preferredCities: Array.isArray(body?.preferredCities) ? body.preferredCities : undefined,
      preferredPropertyTypes: Array.isArray(body?.preferredPropertyTypes) ? body.preferredPropertyTypes : undefined,
      preferredModes: Array.isArray(body?.preferredModes) ? body.preferredModes : undefined,
      budgetMin: typeof body?.budgetMin === "number" ? body.budgetMin : undefined,
      budgetMax: typeof body?.budgetMax === "number" ? body.budgetMax : undefined,
      strategyMode: typeof body?.strategyMode === "string" ? body.strategyMode : undefined,
      riskTolerance: typeof body?.riskTolerance === "string" ? body.riskTolerance : undefined,
    },
  });

  return NextResponse.json({ ok: true, preferences: row });
}
