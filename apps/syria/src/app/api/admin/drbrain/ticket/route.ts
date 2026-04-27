import { NextResponse } from "next/server";
import { updateDrBrainTicketInMemory } from "@repo/drbrain";
import type { DrBrainTicketStatus } from "@repo/drbrain";
import { getAdminUser } from "@/lib/auth";
import {
  appendSyriaDrBrainTicketStatus,
  loadSyriaDrBrainTicketsFromAudit,
  syriaDrBrainTicketExists,
} from "@/lib/drbrain/ticket-audit";

const ACTIONS = ["ACKNOWLEDGE", "RESOLVE", "IGNORE"] as const;

function mapAction(a: string): DrBrainTicketStatus | null {
  if (a === "ACKNOWLEDGE") return "ACKNOWLEDGED";
  if (a === "RESOLVE") return "RESOLVED";
  if (a === "IGNORE") return "IGNORED";
  return null;
}

export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
  }

  const ticketId =
    typeof body === "object" &&
    body !== null &&
    "ticketId" in body &&
    typeof (body as { ticketId: unknown }).ticketId === "string"
      ? (body as { ticketId: string }).ticketId.trim()
      : "";

  const actionRaw =
    typeof body === "object" &&
    body !== null &&
    "action" in body &&
    typeof (body as { action: unknown }).action === "string"
      ? (body as { action: string }).action.trim().toUpperCase()
      : "";

  if (!ticketId || !ACTIONS.includes(actionRaw as (typeof ACTIONS)[number])) {
    return NextResponse.json({ ok: false, message: "Missing ticketId or invalid action" }, { status: 400 });
  }

  const status = mapAction(actionRaw);
  if (!status) {
    return NextResponse.json({ ok: false, message: "Bad action" }, { status: 400 });
  }

  const exists = await syriaDrBrainTicketExists(ticketId);
  if (!exists) {
    return NextResponse.json({ ok: false, message: "Ticket not found" }, { status: 404 });
  }

  await appendSyriaDrBrainTicketStatus({
    ticketId,
    status,
    actorId: admin.id,
  });

  updateDrBrainTicketInMemory(ticketId, status);

  const tickets = await loadSyriaDrBrainTicketsFromAudit();
  const updated = tickets.find((t) => t.id === ticketId);

  return NextResponse.json({ ok: true, ticket: updated ?? null });
}
