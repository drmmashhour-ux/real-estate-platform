import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireDocumentUser } from "@/modules/documents/services/api-helpers";

export async function requireIntakeUser(
  request: NextRequest
): Promise<{ userId: string; role: PlatformRole } | NextResponse> {
  return requireDocumentUser(request);
}

export async function getBrokerClientForIntake(brokerClientId: string) {
  return prisma.brokerClient.findUnique({
    where: { id: brokerClientId },
    include: {
      intakeProfile: true,
      linkedUser: { select: { id: true, email: true, name: true } },
      broker: { select: { id: true, name: true, email: true } },
    },
  });
}
