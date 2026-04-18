import { PlatformRole } from "@prisma/client";
import { brokerOpsFlags } from "@/config/feature-flags";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { postMessage } from "@/modules/broker-collaboration/thread.service";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
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

  let body: { body?: string; messageType?: import("@prisma/client").BrokerCollaborationMessageType };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.body || typeof body.body !== "string") {
    return Response.json({ error: "body required" }, { status: 400 });
  }

  const res = await postMessage(session.userId, role, id, {
    body: body.body,
    messageType: body.messageType,
  });

  if ("error" in res) {
    return Response.json({ error: res.error }, { status: res.error === "Thread not found" ? 404 : 403 });
  }
  return Response.json(res);
}
