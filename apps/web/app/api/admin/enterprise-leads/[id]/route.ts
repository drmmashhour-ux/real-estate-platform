import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { EnterpriseLeadSegment, EnterpriseLeadStage } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertAdminResponse } from "@/lib/admin/assert-admin";
import { suggestedLeadScoreFromStage } from "@/lib/enterprise/sales-lead-rules";

export const dynamic = "force-dynamic";

const SEGMENTS = new Set<string>(Object.values(EnterpriseLeadSegment));
const STAGES = new Set<string>(Object.values(EnterpriseLeadStage));

function parseOptionalDate(v: unknown): Date | null | undefined {
  if (v === null) return null;
  if (typeof v !== "string" || !v.trim()) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const err = await assertAdminResponse();
  if (err) return err;
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const data: Prisma.EnterpriseLeadUpdateInput = {};

  if (typeof body.companyName === "string") data.companyName = body.companyName.trim();
  if (typeof body.contactName === "string") data.contactName = body.contactName.trim() || null;
  if (typeof body.email === "string") data.email = body.email.trim().toLowerCase();
  if (typeof body.phone === "string") data.phone = body.phone.trim().slice(0, 64) || null;
  if (typeof body.notes === "string") data.notes = body.notes.trim() || null;

  if (typeof body.segment === "string") {
    const s = body.segment.toUpperCase();
    if (!SEGMENTS.has(s)) return NextResponse.json({ error: "Invalid segment" }, { status: 400 });
    data.segment = s as EnterpriseLeadSegment;
  }

  if (typeof body.stage === "string") {
    const s = body.stage.toUpperCase();
    if (!STAGES.has(s)) return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    data.stage = s as EnterpriseLeadStage;
    if (body.syncScoreFromStage === true) {
      data.leadScore = suggestedLeadScoreFromStage(s as EnterpriseLeadStage);
    }
  }

  if (body.dealValueEstimateCents === null) data.dealValueEstimateCents = null;
  if (typeof body.dealValueEstimateCents === "number" && Number.isFinite(body.dealValueEstimateCents)) {
    data.dealValueEstimateCents = Math.max(0, Math.round(body.dealValueEstimateCents));
  }
  if (typeof body.dealValueEstimateDollars === "number" && Number.isFinite(body.dealValueEstimateDollars)) {
    data.dealValueEstimateCents = Math.max(0, Math.round(body.dealValueEstimateDollars * 100));
  }

  const fu = parseOptionalDate(body.followUpAt);
  if (fu !== undefined) data.followUpAt = fu;

  if (body.leadScore === null) data.leadScore = null;
  if (typeof body.leadScore === "number" && Number.isFinite(body.leadScore)) {
    data.leadScore = Math.max(0, Math.min(100, Math.round(body.leadScore)));
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No updates" }, { status: 400 });
  }

  try {
    const row = await prisma.enterpriseLead.update({ where: { id }, data });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const err = await assertAdminResponse();
  if (err) return err;
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    await prisma.enterpriseLead.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
