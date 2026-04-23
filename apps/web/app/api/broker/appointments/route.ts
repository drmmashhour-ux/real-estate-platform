import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;
  const { session } = gate;

  const where =
    session.role === "ADMIN"
      ? {}
      : {
          brokerId: session.id,
        };

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { startsAt: "asc" },
    take: 200,
    include: {
      clientUser: { select: { id: true, name: true, email: true } },
      listing: { select: { id: true, title: true } },
      brokerClient: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json({ ok: true, appointments });
}
