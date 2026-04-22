import {
  buildPitchDeckPdf,
  buildSummaryReport,
  financialSnapshotJson,
  type InvestorExportKind,
} from "@/modules/investor/investor-export.service";
import { getInvestorPitchDashboardVm } from "@/modules/investor/investor-pitch-data.service";
import { canViewLiveInvestorPitchDashboard } from "@/modules/investor/investor-pitch-access";

export const dynamic = "force-dynamic";

const KINDS = new Set<InvestorExportKind>(["pitch_pdf", "summary_report", "financial_snapshot"]);

/**
 * GET /api/investor/pitch-export?kind=pitch_pdf|summary_report|financial_snapshot&sample=1
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const kindRaw = url.searchParams.get("kind") ?? "";
  const sampleParam = url.searchParams.get("sample") === "1";

  if (!KINDS.has(kindRaw as InvestorExportKind)) {
    return Response.json({ error: "Invalid or missing kind" }, { status: 400 });
  }
  const kind = kindRaw as InvestorExportKind;

  const allowLive = await canViewLiveInvestorPitchDashboard();
  const sampleMode = sampleParam || !allowLive;
  const vm = await getInvestorPitchDashboardVm({ sampleMode });

  const label = vm.sampleMode ? "sample" : "live";

  if (kind === "pitch_pdf") {
    const buf = buildPitchDeckPdf(vm);
    return new Response(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="lecipm-investor-pitch-${label}.pdf"`,
      },
    });
  }

  if (kind === "summary_report") {
    const text = buildSummaryReport(vm);
    return new Response(text, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="lecipm-summary-${label}.md"`,
      },
    });
  }

  const json = financialSnapshotJson(vm);
  return new Response(json, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="lecipm-financial-snapshot-${label}.json"`,
    },
  });
}
