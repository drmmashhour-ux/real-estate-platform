import { NextResponse } from "next/server";
import { getGuestId, getUserRole } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo-mode";
import { AI_LEGAL_DISCLAIMER } from "@/lib/legal/ai-legal-disclaimer";
import { demoLegalExplainSection } from "@/lib/legal/demo-legal-ai";
import { aiExplainLicenseSection } from "@/lib/legal/ai-legal-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (isDemoMode()) {
    return NextResponse.json({
      ok: true,
      source: "demo" as const,
      plainSummary: demoLegalExplainSection.plainSummary,
      example: demoLegalExplainSection.example,
      disclaimer: demoLegalExplainSection.disclaimer,
    });
  }

  let body: { sectionTitle?: string; sectionBody?: string; locale?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const sectionTitle = typeof body.sectionTitle === "string" ? body.sectionTitle.trim() : "";
  const sectionBody = typeof body.sectionBody === "string" ? body.sectionBody.trim() : "";
  if (!sectionTitle || !sectionBody) {
    return NextResponse.json({ error: "sectionTitle and sectionBody required" }, { status: 400 });
  }

  const role = (await getUserRole()) ?? "user";
  const r = await aiExplainLicenseSection({
    userId,
    role,
    sectionTitle,
    sectionBody,
    locale: body.locale,
  });

  return NextResponse.json({
    ok: true,
    source: r.source,
    text: r.text,
    plainSummary: r.text,
    disclaimer: AI_LEGAL_DISCLAIMER,
    logId: r.logId,
  });
}
