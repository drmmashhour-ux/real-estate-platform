import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { incrementDailyProgress } from "@/lib/client-acquisition/daily-progress";
import { requireAcquisitionAdmin } from "@/lib/client-acquisition/auth";

export const dynamic = "force-dynamic";

const ALLOWED_SOURCES = new Set(["facebook", "instagram", "marketplace", "other"]);

function normalizeSource(s: string | undefined): string | undefined {
  if (s === undefined) return undefined;
  const x = s.toLowerCase().trim();
  if (x === "ig") return "instagram";
  if (ALLOWED_SOURCES.has(x)) return x;
  return "other";
}

const SERVICES = new Set(["mortgage", "rent", "buy"]);

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAcquisitionAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  const prev = await prisma.clientAcquisitionLead.findFirst({
    where: { id, ownerId: auth.userId },
  });
  if (!prev) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as {
    name?: string;
    source?: string;
    phone?: string | null;
    notes?: string | null;
    messageSent?: boolean;
    replied?: boolean;
    interested?: boolean;
    callScheduled?: boolean;
    closed?: boolean;
    serviceType?: string | null;
    valueCents?: number | null;
    revenueCents?: number | null;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const now = new Date();
  const data: Prisma.ClientAcquisitionLeadUpdateInput = {};

  if (body.name !== undefined) data.name = body.name.trim() || prev.name;
  if (body.source !== undefined) data.source = normalizeSource(body.source) ?? prev.source;
  if (body.phone !== undefined) data.phone = body.phone?.trim() || null;
  if (body.notes !== undefined) data.notes = body.notes ?? null;

  if (body.messageSent !== undefined) data.messageSent = body.messageSent;
  if (body.replied !== undefined) data.replied = body.replied;
  if (body.interested !== undefined) data.interested = body.interested;
  if (body.callScheduled !== undefined) data.callScheduled = body.callScheduled;
  if (body.closed !== undefined) data.closed = body.closed;

  if (body.serviceType !== undefined) {
    const st = body.serviceType?.toLowerCase().trim();
    data.serviceType = st && SERVICES.has(st) ? st : null;
  }
  if (body.valueCents !== undefined) {
    data.valueCents = body.valueCents === null || Number.isNaN(Number(body.valueCents)) ? null : Math.max(0, Math.round(Number(body.valueCents)));
  }
  if (body.revenueCents !== undefined) {
    data.revenueCents =
      body.revenueCents === null || Number.isNaN(Number(body.revenueCents)) ? null : Math.max(0, Math.round(Number(body.revenueCents)));
  }

  // Timestamps + daily progress (first transition only, UTC today)
  const nextMessageSent = body.messageSent !== undefined ? body.messageSent : prev.messageSent;
  const nextCall = body.callScheduled !== undefined ? body.callScheduled : prev.callScheduled;
  const nextClosed = body.closed !== undefined ? body.closed : prev.closed;
  const nextReplied = body.replied !== undefined ? body.replied : prev.replied;
  const nextInterested = body.interested !== undefined ? body.interested : prev.interested;

  if (body.closed === false && prev.closed) {
    data.closed = false;
    data.closedAt = null;
  }

  if (nextMessageSent && !prev.messageSentAt) {
    data.messageSentAt = now;
    await incrementDailyProgress(auth.userId, now, "contacts", 1);
  }
  if (!prev.repliedAt && nextReplied) {
    data.repliedAt = now;
  }
  if (!prev.interestedAt && nextInterested) {
    data.interestedAt = now;
  }
  if (nextCall && !prev.callAt) {
    data.callAt = now;
    await incrementDailyProgress(auth.userId, now, "callsBooked", 1);
  }
  if (nextClosed && !prev.closedAt && body.closed !== false) {
    data.closedAt = now;
    data.closed = true;
    await incrementDailyProgress(auth.userId, now, "clientsClosed", 1);
  }

  const lead = await prisma.clientAcquisitionLead.update({
    where: { id },
    data,
  });

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
      messageSentAt: lead.messageSentAt?.toISOString() ?? null,
      repliedAt: lead.repliedAt?.toISOString() ?? null,
      interestedAt: lead.interestedAt?.toISOString() ?? null,
      callAt: lead.callAt?.toISOString() ?? null,
      closedAt: lead.closedAt?.toISOString() ?? null,
      serviceType: lead.serviceType,
      valueCents: lead.valueCents,
      revenueCents: lead.revenueCents,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    },
  });
}
