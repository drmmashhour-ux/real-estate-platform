import { complianceAdminFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getQaReview } from "@/modules/qa-review/qa-review.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminSession();
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  if (!complianceAdminFlags.brokerageQaReviewV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const review = await getQaReview(id);
  if (!review) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ review });
}
