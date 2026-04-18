import { PlatformRole } from "@prisma/client";
import { brokerOpsFlags } from "@/config/feature-flags";
import { requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { createInternalNote } from "@/modules/broker-collaboration/internal-note.service";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

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

  let body: Parameters<typeof createInternalNote>[2];
  try {
    body = (await request.json()) as Parameters<typeof createInternalNote>[2];
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const res = await createInternalNote(session.userId, role, body);
  if ("error" in res) {
    return Response.json({ error: res.error }, { status: 403 });
  }
  return Response.json(res);
}
