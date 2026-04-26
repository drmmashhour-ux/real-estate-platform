import { PlatformRole } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import {
  declareHostBnhubBookingChecklist,
  ensureBnhubBookingChecklist,
  listBnhubBookingChecklistForHost,
} from "@/lib/bnhub/booking-checklist";
import { assertBnhubHostOrAdmin } from "@/lib/mobile/mobileAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await assertBnhubHostOrAdmin(request);
    const { id } = await params;
    let rows;
    if (user.role === PlatformRole.ADMIN) {
      const ex = await prisma.booking.findUnique({ where: { id }, select: { id: true } });
      if (!ex) return Response.json({ error: "Not found" }, { status: 404 });
      await ensureBnhubBookingChecklist(id);
      rows = await prisma.bnhubBookingChecklistItem.findMany({
        where: { bookingId: id },
        orderBy: { itemKey: "asc" },
      });
    } else {
      rows = await listBnhubBookingChecklistForHost(id, user.id);
    }
    if (!rows) return Response.json({ error: "Not found" }, { status: 404 });
    const b = await prisma.booking.findUnique({
      where: { id },
      select: { checklistDeclaredByHostAt: true },
    });
    return Response.json({
      hostDeclaredAt: b?.checklistDeclaredByHostAt?.toISOString() ?? null,
      items: rows.map((r) => ({
        id: r.id,
        itemKey: r.itemKey,
        label: r.label,
        expected: r.expected,
        confirmed: r.confirmed,
        note: r.note,
      })),
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 401) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (err.status === 403) return Response.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }
}

/** POST — host confirms default arrival checklist is accurate before guest check-in. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await assertBnhubHostOrAdmin(request);
    if (user.role === PlatformRole.ADMIN) {
      return Response.json({ error: "Use host session to declare checklist" }, { status: 403 });
    }
    const { id } = await params;
    const result = await declareHostBnhubBookingChecklist(id, user.id);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    return Response.json({ ok: true, declaredAt: new Date().toISOString() });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 401) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (err.status === 403) return Response.json({ error: "Forbidden" }, { status: 403 });
    throw e;
  }
}
