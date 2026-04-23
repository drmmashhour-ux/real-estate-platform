import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { finalizeBrokerAppraisalCase } from "@/lib/appraisal/broker-appraisal-case.service";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("broker");
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  try {
    const row = await finalizeBrokerAppraisalCase({ caseId: id, brokerUserId: auth.user.id });
    return NextResponse.json({ case: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "FAILED";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (msg === "ALREADY_FINALIZED") {
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    if (
      msg === "APPRAISAL_BROKER_REVIEW_REQUIRED" ||
      msg.startsWith("COMPARABLES_") ||
      msg.startsWith("ADJUSTMENTS_") ||
      msg.startsWith("ASSUMPTIONS_") ||
      msg.startsWith("CONCLUSION_") ||
      msg.startsWith("BROKER_") ||
      msg === "APPRAISAL_REVIEW_INCOMPLETE"
    ) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
