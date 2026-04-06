import {
  listBnhubBookingChecklistForGuest,
  patchGuestBnhubBookingChecklist,
} from "@/lib/bnhub/booking-checklist";
import { requireMobileUser } from "@/lib/mobile/mobileAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireMobileUser(request);
    const { id } = await params;
    const pack = await listBnhubBookingChecklistForGuest(id, user.id);
    if (!pack) return Response.json({ error: "Not found" }, { status: 404 });
    if (pack === "forbidden") {
      return Response.json({ error: "Checklist is available after payment is confirmed" }, { status: 403 });
    }
    return Response.json({
      hostDeclaredAt: pack.hostDeclaredAt?.toISOString() ?? null,
      items: pack.items.map((r) => ({
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
    throw e;
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireMobileUser(request);
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      updates?: { itemKey: string; confirmed: boolean; note?: string | null }[];
    };
    const updates = Array.isArray(body.updates) ? body.updates : [];
    if (updates.length === 0) {
      return Response.json({ error: "updates[] required" }, { status: 400 });
    }
    const result = await patchGuestBnhubBookingChecklist(id, user.id, updates);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    const pack = await listBnhubBookingChecklistForGuest(id, user.id);
    const rows = pack && pack !== "forbidden" ? pack.items : null;
    return Response.json({
      ok: true,
      hostDeclaredAt: pack && pack !== "forbidden" ? pack.hostDeclaredAt?.toISOString() ?? null : null,
      items: rows?.map((r) => ({ id: r.id, itemKey: r.itemKey, label: r.label, expected: r.expected, confirmed: r.confirmed, note: r.note })),
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 401) return Response.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }
}
