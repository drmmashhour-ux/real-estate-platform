import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/** Broker handoff — comparison context in mortgageInquiry JSON */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const email = String(body.email ?? "").trim();
  const name = body.name != null ? String(body.name) : "";
  const phone = body.phone != null ? String(body.phone) : "—";
  const listingIds = Array.isArray(body.listingIds) ? body.listingIds.map(String) : [];
  const mode = body.mode != null ? String(body.mode) : "";

  if (!email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const message = JSON.stringify({
    type: "property_comparison_broker",
    listingIds,
    mode,
    note: body.note != null ? String(body.note) : "",
  }).slice(0, 12000);

  const lead = await prisma.lead.create({
    data: {
      name: name.trim() || "Comparison inquiry",
      email,
      phone: phone.trim() || "—",
      message,
      status: "new",
      score: 58,
      leadSource: "property_comparison",
      leadType: "tool",
      mortgageInquiry: {
        propertyComparison: true,
        listingIds,
        mode,
      },
    },
  });

  await prisma.toolUsageEvent.create({
    data: {
      toolKey: "property_compare",
      eventType: "lead_submit",
      payloadJson: { leadId: lead.id, listingIds },
    },
  });

  return NextResponse.json({ ok: true, leadId: lead.id });
}
