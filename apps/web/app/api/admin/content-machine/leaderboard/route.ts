import { NextResponse } from "next/server";
import { ContentMachineStyle } from "@prisma/client";
import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  contentMachinePerformanceScore,
  getTopPerformingMachineContent,
  type TopMachineContentOrderBy,
} from "@/lib/content-machine/performance";

export const dynamic = "force-dynamic";

const STYLE_VALUES = Object.values(ContentMachineStyle) as string[];
const STYLES = new Set(STYLE_VALUES);

export async function GET(req: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const url = new URL(req.url);
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 40;
  const orderParam = (url.searchParams.get("orderBy") ?? "score") as TopMachineContentOrderBy;
  const orderBy: TopMachineContentOrderBy =
    orderParam === "conversions" || orderParam === "views" || orderParam === "clicks" || orderParam === "score"
      ? orderParam
      : "score";
  const styleParam = url.searchParams.get("style")?.trim();
  const style =
    styleParam && STYLES.has(styleParam) ? (styleParam as ContentMachineStyle) : undefined;

  const rows = await getTopPerformingMachineContent({ limit, orderBy, style });

  return NextResponse.json({
    orderBy,
    style: style ?? null,
    rows: rows.map((r) => ({
      id: r.id,
      style: r.style,
      hook: r.hook,
      views: r.views,
      clicks: r.clicks,
      conversions: r.conversions,
      score: contentMachinePerformanceScore(r.views, r.clicks, r.conversions),
      listing: r.listing,
    })),
  });
}
