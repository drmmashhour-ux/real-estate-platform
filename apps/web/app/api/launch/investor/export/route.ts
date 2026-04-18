import { lecipmLaunchInvestorFlags } from "@/config/feature-flags";
import { requirePlatformLaunchInvestor } from "@/lib/launch-investor-api-auth";
import { buildLaunchInvestorExport, type ExportKind } from "@/modules/investor-export/metrics-export.service";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";

export const dynamic = "force-dynamic";

const KINDS = new Set<ExportKind>(["metrics_json", "snapshots_csv", "snapshots_json", "investor_txt"]);

export async function POST(request: Request) {
  const auth = await requirePlatformLaunchInvestor();
  if (!auth.ok) return auth.response;
  if (!lecipmLaunchInvestorFlags.investorMetricsV1) {
    return Response.json({ error: "Investor metrics module disabled" }, { status: 403 });
  }

  let kind: ExportKind = "metrics_json";
  try {
    const body = (await request.json()) as { kind?: ExportKind };
    if (body.kind && KINDS.has(body.kind)) kind = body.kind;
  } catch {
    /* default */
  }

  const { contentType, filename, body } = await buildLaunchInvestorExport(kind);

  await logGrowthEngineAudit({
    actorUserId: auth.userId,
    action: "investor_export_generated",
    payload: { kind, filename },
  });

  return new Response(typeof body === "string" ? body : Buffer.from(body), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
