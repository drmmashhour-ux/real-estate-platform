import { brokerageOfficeFlags } from "@/config/feature-flags";
import { roleCanManageRoster } from "@/lib/brokerage/office-access";
import { resolveBrokerOfficeRequest } from "@/lib/brokerage/resolve-office-api";
import { updateMembership } from "@/modules/brokerage-office/office-membership.service";
import type { OfficeMemberPatch } from "@/modules/brokerage-office/brokerage-office.types";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const resolved = await resolveBrokerOfficeRequest(request, "officeManagementV1");
  if ("error" in resolved) return resolved.error;
  if (!roleCanManageRoster(resolved.access.membership.role)) {
    return Response.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { id } = await ctx.params;

  let body: OfficeMemberPatch;
  try {
    body = (await request.json()) as OfficeMemberPatch;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const row = await updateMembership(id, resolved.officeId, resolved.session.userId, body);
  return Response.json({ membership: row });
}
