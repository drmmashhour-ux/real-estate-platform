import { PlatformRole } from "@prisma/client";
import { brokerOpsFlags } from "@/config/feature-flags";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { updateDealAssignment } from "@/modules/broker-workload/assignment.service";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  if (!brokerOpsFlags.brokerageTeamCollabV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  const role = user?.role ?? PlatformRole.USER;

  let body: { status?: import("@prisma/client").BrokerDealAssignmentStatus };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const res = await updateDealAssignment({
    actorId: session.userId,
    role,
    assignmentId: id,
    status: body.status,
  });

  if ("error" in res) {
    return Response.json({ error: res.error }, { status: res.error === "Not found" ? 404 : 403 });
  }
  return Response.json(res);
}
