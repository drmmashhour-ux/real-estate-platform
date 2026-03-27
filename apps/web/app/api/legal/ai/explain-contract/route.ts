import { NextResponse } from "next/server";
import { getGuestId, getUserRole } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo-mode";
import { AI_LEGAL_DISCLAIMER } from "@/lib/legal/ai-legal-disclaimer";
import { demoContractExplain } from "@/lib/legal/demo-legal-ai";
import { aiExplainContractPlain } from "@/lib/legal/ai-legal-service";
import { BUYER_ACKNOWLEDGMENT_HTML, MORTGAGE_DISCLOSURE_HTML } from "@/modules/legal/form-content";

export const dynamic = "force-dynamic";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);
}

export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (isDemoMode()) {
    return NextResponse.json({
      ok: true,
      source: "demo" as const,
      summary: demoContractExplain.summary,
      risks: demoContractExplain.risks,
      consequences: demoContractExplain.consequences,
      disclaimer: demoContractExplain.disclaimer,
    });
  }

  let body: { kind?: "buyer" | "mortgage" };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const kind = body.kind === "mortgage" ? "mortgage" : "buyer";
  const html = kind === "mortgage" ? MORTGAGE_DISCLOSURE_HTML : BUYER_ACKNOWLEDGMENT_HTML;
  const plain = stripHtml(html);
  const role = (await getUserRole()) ?? "user";

  const r = await aiExplainContractPlain({
    userId,
    role,
    contractKind: kind,
    plainTextExcerpt: plain,
  });

  return NextResponse.json({
    ok: true,
    source: r.source,
    text: r.text,
    disclaimer: AI_LEGAL_DISCLAIMER,
    logId: r.logId,
  });
}
