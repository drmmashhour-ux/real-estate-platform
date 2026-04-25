#!/usr/bin/env python3
"""
Executive / board report PDF — ReportLab only.
Usage: python3 generate_executive_report.py <input.json> <output.pdf>
"""

from __future__ import annotations

import json
import sys
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def esc(x) -> str:
    return escape(str(x)) if x is not None else ""


def para_block(styles, body: str, normal_style):
    lines = [ln.strip() for ln in str(body or "").split("\n") if ln.strip()]
    if not lines:
        return [Paragraph("(No text)", normal_style)]
    return [Paragraph(esc(ln), normal_style) for ln in lines]


def main() -> None:
    if len(sys.argv) < 3:
        print("usage: python3 generate_executive_report.py <input.json> <output.pdf>", file=sys.stderr)
        sys.exit(2)

    data_path, output_path = sys.argv[1], sys.argv[2]
    with open(data_path, encoding="utf-8") as f:
        data = json.load(f)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        name="ExecTitle",
        parent=styles["Title"],
        fontSize=18,
        leading=22,
        spaceAfter=6,
    )
    h2 = ParagraphStyle(name="ExecH2", parent=styles["Heading2"], spaceBefore=10, spaceAfter=6)
    muted = ParagraphStyle(name="ExecMuted", parent=styles["Normal"], fontSize=8, textColor=colors.grey)

    meta = data.get("meta") or {}
    period = esc(meta.get("periodKey") or "")
    generated = esc(meta.get("generatedAtUtc") or "")
    disclaimer = esc(
        meta.get("disclaimer")
        or "Operational data export — metrics trace to cited tables in JSON; not financial advice."
    )

    doc = SimpleDocTemplate(
        output_path,
        pagesize=LETTER,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.7 * inch,
        bottomMargin=0.7 * inch,
    )
    flow = []

    # Title
    flow.append(Paragraph("Executive / Board Report", title_style))
    flow.append(Paragraph(f"Period: {period}", styles["Normal"]))
    if generated:
        flow.append(Paragraph(f"Generated (UTC): {generated}", muted))
    flow.append(Paragraph(disclaimer, muted))
    flow.append(Spacer(1, 14))

    narrative = data.get("narrative") or {}
    summary_text = narrative.get("summaryText") or data.get("summaryText") or ""

    flow.append(Paragraph("Summary", h2))
    flow.extend(para_block(styles, summary_text, styles["Normal"]))
    flow.append(Spacer(1, 8))

    kpi = data.get("kpi") or {}
    flow.append(Paragraph("KPI (selected)", h2))
    krows = [["Metric", "Value"]]
    for label, key in [
        ("Leads created", ("leadsCreated", "value")),
        ("Pipeline deals opened", ("pipelineDealsCreated", "value")),
        ("Pipeline deals closed (period)", ("pipelineDealsClosedInPeriod", "value")),
        ("Committee favorable ratio", ("committeeFavorableRate", "value")),
        ("Pipeline capital sum (active stacks)", ("pipelineCapitalRequiredSum", "value")),
        ("Avg close cycle (days)", ("avgPipelineCloseCycleDays", "value")),
    ]:
        block = kpi.get(key[0]) or {}
        val = block.get(key[1])
        if key[0] == "committeeFavorableRate" and isinstance(val, (int, float)):
            val = f"{float(val) * 100:.1f}%"
        krows.append([esc(label), esc(val if val is not None else "n/a")])

    tk = Table(krows, colWidths=[2.5 * inch, 3.4 * inch])
    tk.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    flow.append(tk)
    flow.append(Spacer(1, 10))

    strat = data.get("strategy") or {}
    flow.append(Paragraph("Strategy", h2))
    flow.append(
        Paragraph(
            f"Execution events delta vs prior: {esc(strat.get('vsPreviousPeriod', {}).get('strategyExecutionEventsDelta'))}; "
            f"reinforcement decisions delta: {esc(strat.get('vsPreviousPeriod', {}).get('reinforcementDecisionsDelta'))}.",
            styles["Normal"],
        )
    )
    top = strat.get("benchmarkTop") or []
    if top:
        flow.append(Paragraph("Top benchmark aggregates (by wins)", styles["Normal"]))
        for row in top[:5]:
            flow.append(
                Paragraph(
                    f"• {esc(row.get('strategyKey'))} ({esc(row.get('domain'))}) — uses {esc(row.get('totalUses'))}, wins {esc(row.get('wins'))}",
                    muted,
                )
            )

    port = data.get("portfolio") or {}
    flow.append(Paragraph("Portfolio highlights", h2))
    for label, key in [("Higher-risk deals", "highRiskDeals"), ("Higher-opportunity deals", "highOpportunityDeals")]:
        flow.append(Paragraph(label, styles["Normal"]))
        deals = port.get(key) or []
        if not deals:
            flow.append(Paragraph("— none matched filters —", muted))
        for d in deals[:5]:
            flow.append(
                Paragraph(
                    f"• {esc(d.get('title'))} — {esc(d.get('pipelineStage'))} — {esc(d.get('underwritingRecommendation'))}",
                    muted,
                )
            )

    inv = data.get("investor") or {}
    flow.append(Paragraph("Investor intelligence", h2))
    oc = (inv.get("opportunityCountInPeriod") or {}).get("value")
    roi = (inv.get("meanExpectedRoiPercent") or {}).get("value")
    flow.append(Paragraph(f"Opportunities in period: {esc(oc)}; mean expectedROI field: {esc(roi)}", styles["Normal"]))
    cst = inv.get("capitalStackTotals") or {}
    flow.append(
        Paragraph(
            f"Active stack rows counted: {esc(cst.get('dealsWithStack'))}; totalCapitalRequired sum: {esc(cst.get('totalCapitalRequiredSum'))}",
            muted,
        )
    )

    aut = data.get("autonomy") or {}
    flow.append(Paragraph("Autonomy", h2))
    flow.append(
        Paragraph(
            f"Actions in period: {esc((aut.get('actionsCreatedInPeriod') or {}).get('value'))}; "
            f"executed/approved/success: {esc((aut.get('approvals') or {}).get('value'))}; "
            f"rejected/skipped/blocked: {esc((aut.get('blockedOrRejected') or {}).get('value'))}.",
            styles["Normal"],
        )
    )
    flow.append(Paragraph(esc(aut.get("autonomyModeSummary") or ""), muted))

    flow.append(Paragraph("Recommendations (system-generated prompts)", h2))
    recs = (data.get("recommendations") or {}).get("items") or []
    if not recs:
        flow.append(Paragraph("— none —", muted))
    for r in recs[:10]:
        flow.append(Paragraph(f"• {esc(r)}", styles["Normal"]))

    flow.append(Spacer(1, 12))
    flow.append(Paragraph("Narrative — key insights", h2))
    for ln in narrative.get("keyInsights") or []:
        flow.append(Paragraph(f"• {esc(ln)}", styles["Normal"]))

    flow.append(Paragraph("Narrative — changes vs previous period", h2))
    for ln in narrative.get("changesVsPreviousPeriod") or []:
        flow.append(Paragraph(f"• {esc(ln)}", styles["Normal"]))

    flow.append(Paragraph("Narrative — risks / opportunities", h2))
    flow.append(Paragraph("<b>Risks</b>", styles["Normal"]))
    for ln in narrative.get("topRisks") or []:
        flow.append(Paragraph(f"• {esc(ln)}", muted))
    flow.append(Paragraph("<b>Opportunities</b>", styles["Normal"]))
    for ln in narrative.get("topOpportunities") or []:
        flow.append(Paragraph(f"• {esc(ln)}", muted))

    flow.append(Paragraph("Narrative — suggested actions", h2))
    for ln in narrative.get("recommendedActions") or []:
        flow.append(Paragraph(f"• {esc(ln)}", styles["Normal"]))

    doc.build(flow)


if __name__ == "__main__":
    main()
