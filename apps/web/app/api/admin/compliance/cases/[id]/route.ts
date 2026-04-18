import { complianceAdminFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getComplianceCaseById, updateComplianceCase } from "@/modules/compliance-admin/compliance-admin.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminSession();
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  if (!complianceAdminFlags.adminComplianceCommandCenterV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const c = await getComplianceCaseById(id);
  if (!c) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ case: c });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminSession();
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  if (!complianceAdminFlags.adminComplianceCommandCenterV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  const { id } = await ctx.params;
  let body: { status?: import("@prisma/client").ComplianceCaseStatus; assignedReviewerId?: string | null; summary?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const row = await updateComplianceCase(id, admin.userId, body);
  return Response.json({ case: row });
}
