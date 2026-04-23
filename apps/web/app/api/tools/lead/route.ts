import { NextRequest, NextResponse } from "next/server";
import { createToolLead, type ToolLeadType } from "@/lib/leads/create-tool-lead";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const VALID: ToolLeadType[] = [
  "investor_lead",
  "first_home_buyer_lead",
  "welcome_tax_lead",
  "municipality_tax_lead",
];

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const leadType = String(body.leadType ?? "") as ToolLeadType;
  if (!VALID.includes(leadType)) {
    return NextResponse.json({ error: "Invalid leadType" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const name = body.name != null ? String(body.name) : undefined;
  const phone = body.phone != null ? String(body.phone) : undefined;
  const city = body.city != null ? String(body.city) : null;
  const toolInputs = (typeof body.toolInputs === "object" && body.toolInputs !== null
    ? body.toolInputs
    : {}) as Record<string, unknown>;
  const toolOutputs = (typeof body.toolOutputs === "object" && body.toolOutputs !== null
    ? body.toolOutputs
    : {}) as Record<string, unknown>;

  const lead = await createToolLead({
    leadType,
    name,
    email,
    phone,
    toolInputs,
    toolOutputs,
    city,
  });

  const userId = await getGuestId();
  await prisma.toolUsageEvent.create({
    data: {
      toolKey: leadType.replace("_lead", ""),
      eventType: "lead_submit",
      city: city ?? undefined,
      userId: userId ?? undefined,
      payloadJson: { leadId: lead.id },
    },
  });

  return NextResponse.json({ ok: true, leadId: lead.id });
}
