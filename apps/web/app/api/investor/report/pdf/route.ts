import { NextResponse } from "next/server";
import { requireCompanyInvestorApiAuth } from "@/lib/investor-company/api-auth";
import {
  buildMonthlyInvestorReportMarkdown,
  getInvestorValuationPayload,
  getCompanyKpiPanelPayload,
} from "@/modules/investor-company/investor-company-metrics.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCompanyInvestorApiAuth();
  if (!auth.ok) return auth.response;

  const [panel, valBlob, markdown] = await Promise.all([
    getCompanyKpiPanelPayload(),
    getInvestorValuationPayload(),
    buildMonthlyInvestorReportMarkdown(),
  ]);

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  let y = 48;
  const margin = 48;
  const maxW = 515;
  const lineH = 12;

  function addTitle(text: string) {
    doc.setFontSize(14);
    doc.text(text, margin, y);
    y += 22;
    doc.setFontSize(9);
  }

  function addParagraph(text: string) {
    const lines = doc.splitTextToSize(text, maxW);
    for (const line of lines) {
      if (y > 740) {
        doc.addPage();
        y = 48;
      }
      doc.text(line, margin, y);
      y += lineH;
    }
    y += 6;
  }

  doc.setFontSize(16);
  doc.text("LECIPM — Investor snapshot", margin, y);
  y += 24;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  addParagraph(`As of ${new Date(panel.asOf).toISOString()} — illustrative metrics; reconcile with finance.`);
  doc.setTextColor(0, 0, 0);

  addTitle("KPIs");
  addParagraph(
    [
      `MRR (est.): $${(panel.kpis.mrrUsd ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      `ARR (est.): $${(panel.kpis.arrUsd ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      `Revenue (30d): $${panel.kpis.revenueLast30dUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      `Leads (30d): ${panel.kpis.leadsLast30d} · Total leads: ${panel.kpis.totalLeadsAllTime}`,
      `Conversion (proxy): ${(panel.kpis.conversionRateOverall * 100).toFixed(1)}%`,
      `Cost / lead: ${panel.kpis.costPerLeadUsd != null ? `$${panel.kpis.costPerLeadUsd.toFixed(2)}` : "—"}`,
      `Revenue / lead: ${panel.kpis.revenuePerLeadUsd != null ? `$${panel.kpis.revenuePerLeadUsd.toFixed(2)}` : "—"}`,
      `Active operators: ${panel.kpis.activeOperators} · Expansion cities: ${panel.kpis.activeCities}`,
    ].join("\n"),
  );

  addTitle("Valuation (illustrative)");
  addParagraph(
    [
      `ARR basis: $${Math.round(valBlob.kpis.arrUsd ?? valBlob.kpis.revenueLast30dUsd * 12).toLocaleString()}`,
      `Multiplier: ${valBlob.valuation.multiplier}x`,
      `Indicative valuation: $${valBlob.valuation.valuationUsd.toLocaleString()}`,
    ].join("\n"),
  );

  addTitle("AI-style insights");
  for (const i of panel.insights) {
    addParagraph(`• ${i.text}`);
  }

  addTitle("Marketplace health");
  addParagraph(
    [
      `Supply/demand: ${panel.marketplaceHealth.supplyDemandRatio?.toFixed(2) ?? "—"}`,
      `Avg response (h): ${panel.marketplaceHealth.avgResponseTimeHours?.toFixed(2) ?? "—"}`,
      `Operator score: ${panel.marketplaceHealth.operatorPerformanceScore?.toFixed(1) ?? "—"}`,
    ].join("\n"),
  );

  addTitle("Unit economics");
  addParagraph(
    [
      `CAC: ${panel.unitEconomics.cacUsd != null ? `$${panel.unitEconomics.cacUsd.toFixed(2)}` : "—"}`,
      `LTV: ${panel.unitEconomics.ltvUsd != null ? `$${panel.unitEconomics.ltvUsd.toFixed(2)}` : "—"}`,
      `LTV/CAC: ${panel.unitEconomics.ltvToCac?.toFixed(2) ?? "—"}`,
    ].join("\n"),
  );

  y += 8;
  addTitle("Note");
  doc.setFontSize(8);
  addParagraph(
    "For the full machine-readable monthly report, use GET /api/investor/report/monthly. " +
      "Excerpt below (truncated).",
  );
  doc.setFontSize(7);
  addParagraph(markdown.slice(0, 4000) + (markdown.length > 4000 ? "\n\n[… truncated …]" : ""));

  const buf = Buffer.from(doc.output("arraybuffer"));
  const fname = `lecipm-investor-${new Date().toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fname}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
