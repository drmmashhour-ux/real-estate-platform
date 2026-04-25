import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { EnterpriseLeadSegment, EnterpriseLeadStage } from "@prisma/client";
import { prisma } from "@repo/db";
import { assertAdminResponse } from "@/lib/admin/assert-admin";
import { suggestedLeadScoreFromStage } from "@/lib/enterprise/sales-lead-rules";

export const dynamic = "force-dynamic";

const SEGMENTS = new Set<string>(Object.values(EnterpriseLeadSegment));
const STAGES = new Set<string>(Object.values(EnterpriseLeadStage));

export async function GET(req: NextRequest) {
  const err = await assertAdminResponse();
  if (err) return err;

  const { searchParams } = new URL(req.url);
  const segment = searchParams.get("segment");
  const stage = searchParams.get("stage");

  const where: Prisma.EnterpriseLeadWhereInput = {};
  if (segment && segment !== "all" && SEGMENTS.has(segment)) {
    where.segment = segment as EnterpriseLeadSegment;
  }
  if (stage && stage !== "all" && STAGES.has(stage)) {
    where.stage = stage as EnterpriseLeadStage;
  }

  const [rows, pipeline, sumRow, countWithEstimate] = await Promise.all([
    prisma.enterpriseLead.findMany({
      where,
      orderBy: [{ followUpAt: "asc" }, { updatedAt: "desc" }],
      take: 500,
    }),
    prisma.enterpriseLead.groupBy({
      by: ["stage"],
      _count: { id: true },
    }),
    prisma.enterpriseLead.aggregate({
      where: { ...where, dealValueEstimateCents: { not: null } },
      _sum: { dealValueEstimateCents: true },
    }),
    prisma.enterpriseLead.count({
      where: { ...where, dealValueEstimateCents: { not: null } },
    }),
  ]);

  const pipelineMap: Record<string, number> = {};
  for (const s of Object.values(EnterpriseLeadStage)) pipelineMap[s] = 0;
  for (const p of pipeline) pipelineMap[p.stage] = p._count.id;

  return NextResponse.json({
    leads: rows,
    pipeline: pipelineMap,
    filteredDealValueSumCents: sumRow._sum.dealValueEstimateCents ?? 0,
    filteredCountWithDealEstimate: countWithEstimate,
  });
}

export async function POST(req: Request) {
  const err = await assertAdminResponse();
  if (err) return err;

  const body = await req.json().catch(() => ({}));
  const companyName = typeof body.companyName === "string" ? body.companyName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const segRaw = typeof body.segment === "string" ? body.segment.toUpperCase() : "";
  if (!companyName || !email || !SEGMENTS.has(segRaw)) {
    return NextResponse.json({ error: "companyName, email, and valid segment required" }, { status: 400 });
  }

  const contactName = typeof body.contactName === "string" ? body.contactName.trim() || null : null;
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 64) || null : null;
  const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;

  let stage: EnterpriseLeadStage = EnterpriseLeadStage.LEAD_IDENTIFIED;
  if (typeof body.stage === "string" && STAGES.has(body.stage.toUpperCase())) {
    stage = body.stage.toUpperCase() as EnterpriseLeadStage;
  }

  let dealValueEstimateCents: number | null = null;
  if (body.dealValueEstimateCents != null && Number.isFinite(Number(body.dealValueEstimateCents))) {
    dealValueEstimateCents = Math.max(0, Math.round(Number(body.dealValueEstimateCents)));
  } else if (typeof body.dealValueEstimateDollars === "number" && Number.isFinite(body.dealValueEstimateDollars)) {
    dealValueEstimateCents = Math.max(0, Math.round(body.dealValueEstimateDollars * 100));
  }

  let followUpAt: Date | null = null;
  if (typeof body.followUpAt === "string" && body.followUpAt) {
    const d = new Date(body.followUpAt);
    if (!Number.isNaN(d.getTime())) followUpAt = d;
  }

  const leadScore =
    body.leadScore != null && Number.isFinite(Number(body.leadScore))
      ? Math.max(0, Math.min(100, Math.round(Number(body.leadScore))))
      : suggestedLeadScoreFromStage(stage);

  const row = await prisma.enterpriseLead.create({
    data: {
      companyName,
      contactName,
      email,
      phone,
      segment: segRaw as EnterpriseLeadSegment,
      stage,
      notes,
      dealValueEstimateCents,
      followUpAt,
      leadScore,
    },
  });

  return NextResponse.json(row);
}
