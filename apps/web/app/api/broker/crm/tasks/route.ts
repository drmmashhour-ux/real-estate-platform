import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";

export const dynamic = "force-dynamic";

/** Open TASK / FOLLOW_UP interactions for the broker's CRM scope. */
export async function GET() {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;
  const { session } = gate;

  const interactions = await prisma.brokerClientInteraction.findMany({
    where: {
      type: { in: ["TASK", "FOLLOW_UP"] },
      completedAt: null,
      ...(session.role === "ADMIN"
        ? {}
        : {
            brokerClient: {
              brokerId: session.id,
            },
          }),
    },
    include: {
      brokerClient: {
        select: {
          id: true,
          fullName: true,
          status: true,
        },
      },
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    take: 300,
  });

  return NextResponse.json({ ok: true, interactions });
}
