import { getMobileAuthUser } from "@/lib/mobile/mobileAuth";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getMobileAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await prisma.userBnhubPreferences.findUnique({
    where: { userId: user.id },
    select: { prefsJson: true, updatedAt: true },
  });

  return Response.json({
    prefs: row?.prefsJson ?? {},
    updatedAt: row?.updatedAt.toISOString() ?? null,
  });
}

export async function PATCH(request: Request) {
  const user = await getMobileAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { prefs?: unknown };
  if (!body.prefs || typeof body.prefs !== "object" || Array.isArray(body.prefs)) {
    return Response.json({ error: "prefs object required" }, { status: 400 });
  }

  const row = await prisma.userBnhubPreferences.upsert({
    where: { userId: user.id },
    create: { userId: user.id, prefsJson: body.prefs },
    update: { prefsJson: body.prefs },
    select: { prefsJson: true, updatedAt: true },
  });

  return Response.json({
    ok: true,
    prefs: row.prefsJson,
    updatedAt: row.updatedAt.toISOString(),
  });
}
