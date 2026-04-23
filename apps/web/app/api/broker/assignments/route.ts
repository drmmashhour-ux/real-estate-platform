import { PlatformRole } from "@prisma/client";
import { brokerOpsFlags } from "@/config/feature-flags";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { createDealAssignment, listAssignmentsForActor } from "@/modules/broker-workload/assignment.service";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  if (!brokerOpsFlags.brokerageTeamCollabV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  const dealId = new URL(request.url).searchParams.get("dealId") ?? undefined;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  const role = user?.role ?? PlatformRole.USER;

  const assignments = await listAssignmentsForActor(session.userId, role, dealId ?? undefined);
  return Response.json({ assignments });
}

export async function POST(request: Request) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  if (!brokerOpsFlags.brokerageTeamCollabV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  const role = user?.role ?? PlatformRole.USER;

  let body: { dealId?: string; assignedToUserId?: string; roleOnDeal?: import("@prisma/client").BrokerDealAssignmentRole };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.dealId || !body.assignedToUserId || !body.roleOnDeal) {
    return Response.json({ error: "dealId, assignedToUserId, roleOnDeal required" }, { status: 400 });
  }

  const res = await createDealAssignment({
    actorId: session.userId,
    role,
    dealId: body.dealId,
    assignedToUserId: body.assignedToUserId,
    roleOnDeal: body.roleOnDeal,
  });

  if ("error" in res) {
    return Response.json({ error: res.error }, { status: 403 });
  }
  return Response.json(res);
}
