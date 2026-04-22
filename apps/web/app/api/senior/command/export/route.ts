import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { seniorCommandAuth } from "@/lib/senior-command/api-auth";
import { getLatestScoresForLeads } from "@/modules/senior-living/lead-scoring.service";
import { getOperatorSummaries } from "@/modules/senior-living/command/senior-command.service";

export const dynamic = "force-dynamic";

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  const auth = await seniorCommandAuth();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const type = (url.searchParams.get("type") ?? "leads").toLowerCase();
  const format = (url.searchParams.get("format") ?? "csv").toLowerCase();

  if (format === "pdf") {
    return NextResponse.json(
      {
        error:
          "PDF export is prepared for investor packs — generate server-side from CSV using your doc pipeline for now.",
        hint: "Use format=csv or integrate react-pdf / external renderer.",
      },
      { status: 501 },
    );
  }

  if (type === "leads") {
    const rows = await prisma.seniorLead.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        residence: { select: { name: true, city: true } },
      },
    });
    const ids = rows.map((r) => r.id);
    const scores = await getLatestScoresForLeads(ids);
    const header = ["id", "createdAt", "status", "city", "residence", "requester", "email", "score", "band"];
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [
          r.id,
          r.createdAt.toISOString(),
          r.status,
          r.residence.city,
          r.residence.name,
          csvEscape(r.requesterName),
          csvEscape(r.email),
          scores.get(r.id)?.score ?? "",
          scores.get(r.id)?.band ?? "",
        ].join(","),
      ),
    ];
    const csv = lines.join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="senior-leads-${Date.now()}.csv"`,
      },
    });
  }

  if (type === "performance") {
    const ops = await getOperatorSummaries();
    const header = ["operatorId", "name", "residences", "avgResponseH", "conversion", "ranking", "tier"];
    const csv =
      header.join(",") +
      "\n" +
      ops
        .map((o) =>
          [
            o.operatorId,
            csvEscape(o.operatorName),
            o.residenceCount,
            o.avgResponseHours ?? "",
            o.conversionRate ?? "",
            o.rankingScore ?? "",
            o.tier,
          ].join(","),
        )
        .join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="senior-operator-performance-${Date.now()}.csv"`,
      },
    });
  }

  if (type === "revenue") {
    const rules = await prisma.seniorPricingRule.findMany({ orderBy: { updatedAt: "desc" }, take: 80 });
    const header = ["city", "leadBasePrice", "minPrice", "maxPrice", "demandFactor", "qualityFactor", "updatedAt"];
    const csv =
      header.join(",") +
      "\n" +
      rules
        .map((r) =>
          [
            r.city ?? "",
            r.leadBasePrice,
            r.minPrice,
            r.maxPrice,
            r.demandFactor,
            r.qualityFactor,
            r.updatedAt.toISOString(),
          ].join(","),
        )
        .join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="senior-pricing-revenue-${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
}
