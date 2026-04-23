import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { generateAutoAdjustments } from "@/lib/appraisal/auto-adjustment-engine";
import { canAccessDealAnalysisForListing } from "@/lib/appraisal/deal-analysis-access";
import { isDealAnalyzerEnabled } from "@/modules/deal-analyzer/config";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  appraisalCaseId: z.string().min(1),
  comparableId: z.string().min(1),
});

export async function POST(req: Request) {
  if (!isDealAnalyzerEnabled()) {
    return NextResponse.json({ error: "Deal Analyzer disabled" }, { status: 503 });
  }

  const auth = await requireRole("broker");
  if (!auth.ok) return auth.response;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const allowed = await canAccessDealAnalysisForListing(body.appraisalCaseId, auth.user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await generateAutoAdjustments({
      appraisalCaseId: body.appraisalCaseId,
      comparableId: body.comparableId,
      actorUserId: auth.user.id,
    });
    return NextResponse.json({ success: true, result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "GENERATE_FAILED";
    const status =
      msg === "APPRAISAL_CASE_NOT_FOUND" || msg === "COMPARABLE_NOT_FOUND" || msg === "LISTING_DATA_NOT_FOUND"
        ? 404
        : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
