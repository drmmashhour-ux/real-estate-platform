import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import {
  getBrokerAppraisalCaseForUser,
  updateBrokerAppraisalReviewFlags,
} from "@/lib/appraisal/broker-appraisal-case.service";
import { evaluateAppraisalReportGateFromCase } from "@/lib/appraisal/broker-review-gate";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  comparablesReviewed: z.boolean().optional(),
  adjustmentsReviewed: z.boolean().optional(),
  assumptionsReviewed: z.boolean().optional(),
  conclusionReviewed: z.boolean().optional(),
  brokerApproved: z.boolean().optional(),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("broker");
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const row = await getBrokerAppraisalCaseForUser(id, auth.user.id);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const gate = evaluateAppraisalReportGateFromCase(row);
  return NextResponse.json({ case: row, gate });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("broker");
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const updated = await updateBrokerAppraisalReviewFlags({
      caseId: id,
      brokerUserId: auth.user.id,
      patch: body,
    });
    const gate = evaluateAppraisalReportGateFromCase(updated);
    return NextResponse.json({ case: updated, gate });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UPDATE_FAILED";
    if (msg === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
