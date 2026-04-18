import { PlatformRole } from "@prisma/client";
import { brokerOpsFlags } from "@/config/feature-flags";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { brokerWorkspaceAuditKeys, logBrokerWorkspaceEvent } from "@/lib/broker/broker-workspace-audit";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  if (!brokerOpsFlags.brokerageTeamCollabV1) {
    return Response.json({ error: "Brokerage team collaboration disabled" }, { status: 403 });
  }

  const teams = await prisma.brokerTeam.findMany({
    where: {
      OR: [{ ownerBrokerId: session.userId }, { members: { some: { userId: session.userId } } }],
    },
    include: {
      members: { take: 50 },
    },
    orderBy: { updatedAt: "desc" },
    take: 40,
  });

  return Response.json({ teams });
}

export async function POST(request: Request) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  if (!brokerOpsFlags.brokerageTeamCollabV1) {
    return Response.json({ error: "Brokerage team collaboration disabled" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  if (user?.role !== PlatformRole.BROKER && user?.role !== PlatformRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { name?: string };
  try {
    body = (await request.json()) as { name?: string };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = typeof body.name === "string" && body.name.trim().length > 0 ? body.name.trim() : "My brokerage team";

  const team = await prisma.brokerTeam.create({
    data: {
      name: name.slice(0, 160),
      ownerBrokerId: session.userId,
      members: {
        create: {
          userId: session.userId,
          role: "owner",
          status: "active",
          joinedAt: new Date(),
        },
      },
    },
  });

  await logBrokerWorkspaceEvent({
    actorUserId: session.userId,
    actionKey: brokerWorkspaceAuditKeys.teamWorkspaceViewed,
    teamId: team.id,
    payload: { action: "team_created", teamId: team.id },
  });

  return Response.json({ team });
}
