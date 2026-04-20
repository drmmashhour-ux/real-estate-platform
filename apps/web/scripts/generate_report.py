#!/usr/bin/env python3
"""
BNHub investor / board PDF — ReportLab only. Input: JSON path, output PDF path (argv).
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


def main() -> None:
    if len(sys.argv) < 3:
        print("usage: python3 generate_report.py <input.json> <output.pdf>", file=sys.stderr)
        sys.exit(2)

    data_path, output_path = sys.argv[1], sys.argv[2]

    with open(data_path, encoding="utf-8") as f:
        data = json.load(f)

    styles = getSampleStyleSheet()
    meta = data.get("meta") or {}
    summary = data.get("summary") or {}
    portfolio = summary.get("portfolio") or {}
    listings = summary.get("listings") or []
    trend = data.get("trend") or []
    pricing = data.get("pricingImpact") or {}
    narrative = data.get("narrative") or {}
    generated_at = data.get("generatedAt") or ""

    subtitle = meta.get("disclaimer") or "Generated from BNHub analytics — deterministic metrics; not financial advice."

    doc = SimpleDocTemplate(
        output_path,
        pagesize=LETTER,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.7 * inch,
        bottomMargin=0.7 * inch,
    )

    elements = []

    title_style = ParagraphStyle(
        name="BnhubTitle",
        parent=styles["Title"],
        fontSize=18,
        leading=22,
        spaceAfter=6,
    )
    muted = ParagraphStyle(name="Muted", parent=styles["Normal"], fontSize=8, textColor=colors.grey)

    elements.append(Paragraph("BNHub Board / Investor Report", title_style))
    elements.append(Paragraph(esc(meta.get("reportLabel") or subtitle), muted))
    elements.append(Paragraph(esc(subtitle), styles["Normal"]))
    if generated_at:
        elements.append(Paragraph(f"Generated (UTC): {esc(generated_at)}", muted))
    warns = meta.get("exportWarnings")
    if isinstance(warns, list) and warns:
        elements.append(Spacer(1, 6))
        elements.append(Paragraph("<b>Export notes</b>", styles["Normal"]))
        for w in warns[:8]:
            elements.append(Paragraph(f"• {esc(str(w))}", muted))
    elements.append(Spacer(1, 14))

    # KPI
    elements.append(Paragraph("Key performance indicators", styles["Heading2"]))
    elements.append(Spacer(1, 6))

    kpi_data = [
        ["Metric", "Value"],
        ["Gross revenue", esc(round(float(portfolio.get("grossRevenue", 0)), 2))],
        ["Bookings (check-in window)", esc(int(portfolio.get("bookingCount", 0)))],
        ["Occupancy (modeled)", esc(round(float(portfolio.get("occupancyRate", 0)) * 100, 1)) + "%"],
        ["ADR", esc(round(float(portfolio.get("adr", 0)), 2))],
        ["RevPAR", esc(round(float(portfolio.get("revpar", 0)), 2))],
        ["Published listings", esc(int(portfolio.get("listingCount", 0)))],
    ]

    if portfolio.get("mixedCurrencyWarning"):
        kpi_data.append(["Currency note", "Mixed listing currencies — totals sum without FX."])

    t_kpi = Table(kpi_data, colWidths=[2.4 * inch, 3.5 * inch])
    t_kpi.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#374151")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
            ]
        )
    )
    elements.append(t_kpi)
    elements.append(Spacer(1, 14))

    # Narrative
    elements.append(Paragraph("Executive narrative (rules-based)", styles["Heading2"]))
    elements.append(Paragraph(esc("Deterministic summary from the same dashboard inputs — not predictive AI."), muted))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph(esc(narrative.get("headline", "")), styles["Heading3"]))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(esc(narrative.get("overview", "")), styles["BodyText"]))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph(esc(narrative.get("closing", "")), styles["BodyText"]))
    elements.append(Spacer(1, 10))

    facts = narrative.get("facts") or []
    if facts:
        elements.append(Paragraph("Key facts", styles["Heading3"]))
        fd = [["Label", "Value", "Notes"]]
        for fact in facts[:12]:
            fd.append(
                [
                    esc(fact.get("label", "")),
                    esc(fact.get("value", "")),
                    esc((fact.get("explanation") or "")[:280]),
                ]
            )
        t_f = Table(fd, colWidths=[1.4 * inch, 1.3 * inch, 3.4 * inch])
        t_f.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("GRID", (0, 0), (-1, -1), 0.2, colors.HexColor("#d1d5db")),
                ]
            )
        )
        elements.append(t_f)
        elements.append(Spacer(1, 10))

    risks = narrative.get("risks") or []
    opps = narrative.get("opportunities") or []
    if risks:
        elements.append(Paragraph("Risks (rule flags)", styles["Heading3"]))
        for r in risks[:10]:
            elements.append(
                Paragraph(f"<b>{esc(r.get('severity',''))}</b>: {esc(r.get('message',''))}", styles["BodyText"])
            )
        elements.append(Spacer(1, 8))
    if opps:
        elements.append(Paragraph("Opportunities (rule flags)", styles["Heading3"]))
        for o in opps[:10]:
            elements.append(
                Paragraph(f"<b>{esc(o.get('priority',''))}</b>: {esc(o.get('message',''))}", styles["BodyText"])
            )
        elements.append(Spacer(1, 10))

    # Listings
    elements.append(Paragraph("Listing breakdown", styles["Heading2"]))
    elements.append(Spacer(1, 6))

    if not listings:
        elements.append(Paragraph("No listing rows in this export.", styles["Normal"]))
    else:
        ld = [["Listing", "Currency", "Revenue", "Bookings", "Occ %", "ADR", "RevPAR"]]
        for lst in listings[:40]:
            ld.append(
                [
                    esc((lst.get("listingTitle") or "")[:42]),
                    esc(lst.get("currency") or ""),
                    esc(round(float(lst.get("grossRevenue", 0)), 2)),
                    esc(int(lst.get("bookingCount", 0))),
                    esc(round(float(lst.get("occupancyRate", 0)) * 100, 1)),
                    esc(round(float(lst.get("adr", 0)), 2)),
                    esc(round(float(lst.get("revpar", 0)), 2)),
                ]
            )
        t_l = Table(ld, repeatRows=1, colWidths=[1.55 * inch, 0.55 * inch, 0.85 * inch, 0.65 * inch, 0.55 * inch, 0.65 * inch, 0.65 * inch])
        t_l.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("FONTSIZE", (0, 0), (-1, -1), 7),
                    ("GRID", (0, 0), (-1, -1), 0.2, colors.HexColor("#d1d5db")),
                ]
            )
        )
        elements.append(t_l)

    elements.append(Spacer(1, 14))

    # Trend (compact)
    elements.append(Paragraph("Recent booking-creation trend (UTC days)", styles["Heading2"]))
    elements.append(
        Paragraph(
            esc("Daily totals by when bookings were recorded — not guest stay nights."),
            muted,
        )
    )
    elements.append(Spacer(1, 6))

    if trend:
        td = [["Date", "Revenue", "Bookings", "Nights (stay length sum)"]]
        for row in trend[-14:]:
            td.append(
                [
                    esc(row.get("date")),
                    esc(round(float(row.get("revenue", 0)), 2)),
                    esc(int(row.get("bookings", 0))),
                    esc(int(row.get("nights", 0))),
                ]
            )
        t_tr = Table(td, colWidths=[1.1 * inch, 1.2 * inch, 1 * inch, 2 * inch])
        t_tr.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("GRID", (0, 0), (-1, -1), 0.2, colors.HexColor("#d1d5db")),
                ]
            )
        )
        elements.append(t_tr)
    else:
        elements.append(Paragraph("No trend rows.", styles["Normal"]))

    elements.append(Spacer(1, 14))

    # Pricing
    elements.append(Paragraph("Pricing execution (success rows, recent)", styles["Heading2"]))
    elements.append(
        Paragraph(
            f"Successful applies (all time in query): {esc(pricing.get('appliedCount', 0))}. "
            f"Avg nightly delta: {esc(round(float(pricing.get('avgDelta', 0)), 4))}",
            styles["Normal"],
        )
    )
    elements.append(Spacer(1, 6))

    latest = pricing.get("latestExecutions") or []
    if latest:
        pd = [["Listing", "Date", "Old", "New", "Mode"]]
        for ex in latest[:15]:
            listing_title = ""
            if isinstance(ex.get("listing"), dict):
                listing_title = (ex["listing"].get("title") or "")[:36]
            pd.append(
                [
                    esc(listing_title),
                    esc(str(ex.get("date", ""))[:10]),
                    esc(round(float(ex.get("oldPrice", 0)), 2)),
                    esc(round(float(ex.get("newPrice", 0)), 2)),
                    esc(ex.get("mode") or ""),
                ]
            )
        t_p = Table(pd, colWidths=[1.8 * inch, 0.95 * inch, 0.85 * inch, 0.85 * inch, 1 * inch])
        t_p.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("FONTSIZE", (0, 0), (-1, -1), 7),
                    ("GRID", (0, 0), (-1, -1), 0.2, colors.HexColor("#d1d5db")),
                ]
            )
        )
        elements.append(t_p)
    else:
        elements.append(Paragraph("No execution rows in export window.", styles["Normal"]))

    elements.append(Spacer(1, 20))
    elements.append(
        Paragraph(
            esc("LECIPM / BNHub — data sourced from platform Prisma aggregates; no modeled or estimated KPIs unless labeled elsewhere in product."),
            muted,
        )
    )

    doc.build(elements)


if __name__ == "__main__":
    main()
