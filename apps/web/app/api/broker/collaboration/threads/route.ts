import { PlatformRole } from "@prisma/client";
import { brokerOpsFlags } from "@/config/feature-flags";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { createThread, listThreads } from "@/modules/broker-collaboration/thread.service";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  if (!brokerOpsFlags.brokerageTeamCollabV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  const url = new URL(request.url);
  const teamId = url.searchParams.get("teamId") ?? undefined;
  const dealId = url.searchParams.get("dealId") ?? undefined;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  const role = user?.role ?? PlatformRole.USER;

  const threads = await listThreads(session.userId, role, { teamId, dealId });
  return Response.json({ threads });
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

  let body: Parameters<typeof createThread>[2];
  try {
    body = (await request.json()) as Parameters<typeof createThread>[2];
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const res = await createThread(session.userId, role, body);
  if ("error" in res) {
    return Response.json({ error: res.error }, { status: 403 });
  }
  return Response.json(res);
}
