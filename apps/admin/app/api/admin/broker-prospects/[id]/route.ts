import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { addNote, updateProspect } from "@/modules/growth/broker-prospect.service";

export const dynamic = "force-dynamic";

const STATUS_Z = z.enum([
  "new",
  "contacted",
  "replied",
  "demo_scheduled",
  "converted",
  "lost",
]);

const CLOSE_MSG_Z = z.enum(["follow_up", "close", "demo", "objection"]);

const PatchZ = z.object({
  name: z.string().min(1).max(200).optional(),
  agency: z.string().max(200).optional().nullable(),
  phone: z.string().max(80).optional(),
  email: z.string().email().optional(),
  source: z.string().max(40).optional(),
  status: STATUS_Z.optional(),
  notes: z.string().max(20_000).optional().nullable(),
  appendNote: z.string().max(8_000).optional(),
  linkedBrokerUserId: z.string().uuid().nullable().optional(),
  demoLeadUsed: z.boolean().optional(),
  lastCloseMessageType: CLOSE_MSG_Z.optional().nullable(),
  /** Set with lastCloseMessageType to stamp lastCloseContactAt */
  touchCloseContact: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const json = await req.json().catch(() => ({}));
  const parsed = PatchZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const b = parsed.data;

  if (b.appendNote?.trim()) {
    await addNote(id, b.appendNote.trim());
  }

  const demoLeadUsedAt =
    b.demoLeadUsed === true ? new Date() : b.demoLeadUsed === false ? null : undefined;

  const row = await updateProspect(id, {
    name: b.name,
    agency: b.agency,
    phone: b.phone,
    email: b.email,
    source: b.source,
    status: b.status,
    notes: b.notes,
    linkedBrokerUserId: b.linkedBrokerUserId,
    demoLeadUsedAt,
    lastCloseMessageType: b.lastCloseMessageType ?? undefined,
    touchCloseContact: Boolean(b.touchCloseContact && b.lastCloseMessageType),
  });

  return NextResponse.json({ prospect: row });
}
