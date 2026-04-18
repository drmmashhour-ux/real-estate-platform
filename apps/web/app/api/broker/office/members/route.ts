import type { OfficeMembershipRole } from "@prisma/client";
import { brokerageOfficeFlags } from "@/config/feature-flags";
import { roleCanManageRoster } from "@/lib/brokerage/office-access";
import { resolveBrokerOfficeRequest } from "@/lib/brokerage/resolve-office-api";
import { inviteOrAddMember } from "@/modules/brokerage-office/office-membership.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await resolveBrokerOfficeRequest(request, "officeManagementV1");
  if ("error" in ctx) return ctx.error;
  if (!roleCanManageRoster(ctx.access.membership.role)) {
    return Response.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  let body: { userId?: string; role?: OfficeMembershipRole };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.userId || !body.role) {
    return Response.json({ error: "userId and role required" }, { status: 400 });
  }

  const row = await inviteOrAddMember({
    officeId: ctx.officeId,
    userId: body.userId,
    role: body.role,
    actorUserId: ctx.session.userId,
  });
  return Response.json({ membership: row });
}
