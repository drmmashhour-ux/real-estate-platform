import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  getActionPipelineForBroker,
  brokerSignAndExecuteActionPipeline,
} from "@/modules/action-pipeline/action-pipeline.service";

export const dynamic = "force-dynamic";

function clientIp(request: NextRequest): string | null {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip");
}

/**
 * POST — broker (or admin for global rows): mandatory agreement + digital signature record → SIGNED → EXECUTED + hooks.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const visible = await getActionPipelineForBroker(id, userId, user.role === PlatformRole.ADMIN);
  if (!visible) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { agreementConfirmed?: boolean; agreementText?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const out = await brokerSignAndExecuteActionPipeline({
      actionId: id,
      brokerUserId: userId,
      isAdmin: user.role === PlatformRole.ADMIN,
      agreementConfirmed: body.agreementConfirmed === true,
      agreementText: typeof body.agreementText === "string" ? body.agreementText : "",
      ipAddress: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    });
    return NextResponse.json({
      ok: true,
      ...out,
      disclaimer:
        "Execution attestation is in-platform only. Official registry, OACIQ publisher, and counterparty delivery remain the broker’s responsibility.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sign failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
