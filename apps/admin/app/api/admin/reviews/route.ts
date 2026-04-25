import { complianceAdminFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { createQaReview, listQaReviews } from "@/modules/qa-review/qa-review.service";
import type { QaReviewType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  if (!complianceAdminFlags.brokerageQaReviewV1) {
    return Response.json({ error: "QA review disabled" }, { status: 403 });
  }

  const status = new URL(request.url).searchParams.get("status") ?? undefined;
  const reviews = await listQaReviews({ status, take: 80 });
  return Response.json({ reviews });
}

export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  if (!complianceAdminFlags.brokerageQaReviewV1) {
    return Response.json({ error: "QA review disabled" }, { status: 403 });
  }

  let body: { dealId?: string | null; documentId?: string | null; reviewType?: QaReviewType; assign?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.reviewType) {
    return Response.json({ error: "reviewType required" }, { status: 400 });
  }

  const result = await createQaReview({
    actorUserId: admin.userId,
    dealId: body.dealId,
    documentId: body.documentId,
    reviewType: body.reviewType,
    assign: body.assign ?? true,
  });
  return Response.json(result);
}
