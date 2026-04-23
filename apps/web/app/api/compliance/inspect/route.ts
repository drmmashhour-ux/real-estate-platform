import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { z } from "zod";
import { runInspection } from "@/lib/compliance/inspection";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  dsLinked: z.boolean().optional(),
  signature: z.boolean().optional(),
  hash: z.string().optional().nullable(),
  contractNumber: z.string().optional().nullable(),
  persist: z.boolean().optional(),
});

/**
 * Deterministic compliance inspection (OACIQ-style gate). Optional DB snapshot for broker dashboards.
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  if (auth.user.role !== PlatformRole.BROKER) {
    return NextResponse.json({ error: "BROKER_ROLE_REQUIRED" }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const result = runInspection({
    dsLinked: body.dsLinked,
    signature: body.signature,
    hash: body.hash,
    contractNumber: body.contractNumber,
  });

  if (body.persist) {
    try {
      await prisma.complianceInspection.create({
        data: {
          ownerId: auth.user.id,
          result: result.result,
          issues: result.issues,
          context: { manual: true },
        },
      });
      await recordAuditEvent({
        actorUserId: auth.user.id,
        action: "COMPLIANCE_INSPECTION_RECORDED",
        payload: { result: result.result, issues: result.issues, manual: true },
      });
    } catch {
      return NextResponse.json({ error: "INSPECTION_PERSIST_FAILED" }, { status: 503 });
    }
  }

  return NextResponse.json(result);
}
