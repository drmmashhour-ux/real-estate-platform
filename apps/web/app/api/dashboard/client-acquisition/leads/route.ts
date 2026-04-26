import { NextRequest, NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { incrementDailyProgress } from "@/lib/client-acquisition/daily-progress";
import { requireAcquisitionAdmin } from "@/lib/client-acquisition/auth";

export const dynamic = "force-dynamic";

const ALLOWED_SOURCES = new Set(["facebook", "instagram", "marketplace", "other"]);

function normalizeSource(s: string): string {
  const x = (s || "facebook").toLowerCase().trim();
  if (x === "ig") return "instagram";
  if (ALLOWED_SOURCES.has(x)) return x;
  return "other";
}

export async function POST(req: NextRequest) {
  const auth = await requireAcquisitionAdmin();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => null)) as {
    name?: string;
    source?: string;
    phone?: string | null;
    notes?: string | null;
  } | null;

  const name = body?.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const lead = await prisma.clientAcquisitionLead.create({
    data: {
      ownerId: auth.userId,
      name,
      source: normalizeSource(body?.source ?? "facebook"),
      phone: body?.phone?.trim() || null,
      notes: body?.notes?.trim() || null,
    },
  });

  await incrementDailyProgress(auth.userId, new Date(), "leads", 1);

  return NextResponse.json({
    lead: {
      id: lead.id,
      name: lead.name,
      source: lead.source,
      phone: lead.phone,
      notes: lead.notes,
      messageSent: lead.messageSent,
      replied: lead.replied,
      interested: lead.interested,
      callScheduled: lead.callScheduled,
      closed: lead.closed,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    },
  });
}
