import { PlatformRole } from "@prisma/client";
import { brokerOpsFlags } from "@/config/feature-flags";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { assertTeamAccess } from "@/modules/broker-collaboration/visibility.service";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  if (!brokerOpsFlags.brokerageTeamCollabV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  const teamId = new URL(request.url).searchParams.get("teamId");
  if (!teamId) return Response.json({ error: "teamId required" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  const role = user?.role ?? PlatformRole.USER;

  const ok = await assertTeamAccess(session.userId, teamId, role);
  if (!ok) return Response.json({ error: "Forbidden" }, { status: 403 });

  const members = await prisma.brokerTeamMember.findMany({
    where: { teamId },
    orderBy: { joinedAt: "desc" },
  });

  return Response.json({ members });
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

  let body: { teamId?: string; userId?: string; memberRole?: import("@prisma/client").BrokerTeamMemberRole };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.teamId || !body.userId || !body.memberRole) {
    return Response.json({ error: "teamId, userId, memberRole required" }, { status: 400 });
  }

  const team = await prisma.brokerTeam.findFirst({
    where: { id: body.teamId, ownerBrokerId: session.userId },
  });
  if (!team && role !== PlatformRole.ADMIN) {
    return Response.json({ error: "Only team owner may invite" }, { status: 403 });
  }

  const existing = await prisma.brokerTeamMember.findFirst({
    where: { teamId: body.teamId, userId: body.userId },
  });

  const member = existing
    ? await prisma.brokerTeamMember.update({
        where: { id: existing.id },
        data: { role: body.memberRole },
      })
    : await prisma.brokerTeamMember.create({
        data: {
          teamId: body.teamId,
          userId: body.userId,
          role: body.memberRole,
          status: "invited",
        },
      });

  return Response.json({ member });
}
