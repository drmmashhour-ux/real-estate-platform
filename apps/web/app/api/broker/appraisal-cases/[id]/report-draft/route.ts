import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { generateAndPersistReportDraft } from "@/lib/appraisal/broker-appraisal-case.service";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("broker");
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  try {
    const out = await generateAndPersistReportDraft({ caseId: id, brokerUserId: auth.user.id });
    return NextResponse.json(out);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "FAILED";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
