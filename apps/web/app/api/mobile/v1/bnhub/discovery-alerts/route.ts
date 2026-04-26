import { BnhubDiscoveryAlertType } from "@prisma/client";
import { getMobileAuthUser } from "@/lib/mobile/mobileAuth";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

function parseDiscoveryAlertType(raw: unknown): BnhubDiscoveryAlertType | null {
  const s = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  const all = Object.values(BnhubDiscoveryAlertType) as string[];
  if (all.includes(s)) {
    return s as BnhubDiscoveryAlertType;
  }
  return null;
}

export async function GET(request: Request) {
  const user = await getMobileAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.bnhubDiscoveryAlert.findMany({
    where: { userId: user.id, active: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json({
    alerts: rows.map((r) => ({
      id: r.id,
      alertType: r.alertType,
      city: r.city,
      supabaseListingId: r.supabaseListingId,
      prefsJson: r.prefsJson,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const user = await getMobileAuthUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    alertType?: unknown;
    city?: unknown;
    supabaseListingId?: unknown;
    prefsJson?: unknown;
  };

  const alertType = parseDiscoveryAlertType(body.alertType);
  if (!alertType) {
    return Response.json({ error: "Invalid alertType" }, { status: 400 });
  }

  const city = typeof body.city === "string" ? body.city.trim().slice(0, 120) : null;
  const supabaseListingId =
    typeof body.supabaseListingId === "string" ? body.supabaseListingId.trim().slice(0, 80) : null;

  const row = await prisma.bnhubDiscoveryAlert.create({
    data: {
      userId: user.id,
      alertType,
      city: city || null,
      supabaseListingId: supabaseListingId || null,
      prefsJson: body.prefsJson && typeof body.prefsJson === "object" ? body.prefsJson : undefined,
    },
  });

  return Response.json({ ok: true, id: row.id });
}
