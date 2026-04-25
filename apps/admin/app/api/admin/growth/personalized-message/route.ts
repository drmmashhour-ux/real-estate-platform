import { NextRequest, NextResponse } from "next/server";
import { assertAdminResponse } from "@/lib/admin/assert-admin";
import { buildOutreachMessage, OUTREACH_TEMPLATES, personalizeMessage, type OutreachPersona } from "@/services/growth/ai-outreach";

export const dynamic = "force-dynamic";

/** GET ?type=host|guest&name=&area=&template=followup|close */
export async function GET(req: NextRequest) {
  const err = await assertAdminResponse();
  if (err) return err;

  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") || "host").toLowerCase();
  const name = searchParams.get("name");
  const area = searchParams.get("area");
  const templateKey = (searchParams.get("template") || "").toLowerCase();

  const vars = { name: name || undefined, area: area || undefined };

  if (templateKey === "followup" || templateKey === "close") {
    const text = personalizeMessage(OUTREACH_TEMPLATES[templateKey as "followup" | "close"], vars);
    return NextResponse.json({ template: templateKey, text });
  }

  const persona: OutreachPersona = type === "guest" ? "guest" : "host";
  const text = buildOutreachMessage(persona, vars);
  return NextResponse.json({ template: persona, text });
}
