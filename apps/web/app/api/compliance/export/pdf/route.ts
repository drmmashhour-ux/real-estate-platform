import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { buildRegulatorExport } from "@/lib/compliance/regulator-export";
import { assertComplianceOwnerAccess } from "@/lib/compliance/compliance-access";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  ownerType: z.string().min(1),
  ownerId: z.string().min(1),
  exportType: z.string().min(1),
  scopeType: z.string().min(1),
  scopeId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const auth = await requireRole("broker");
  if (!auth.ok) return auth.response;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const access = await assertComplianceOwnerAccess(auth.user, body.ownerType, body.ownerId);
  if (!access.ok) {
    return NextResponse.json({ error: access.message }, { status: 403 });
  }

  const run = await buildRegulatorExport({
    ownerType: body.ownerType,
    ownerId: body.ownerId,
    exportType: body.exportType,
    scopeType: body.scopeType,
    scopeId: body.scopeId ?? null,
    requestedById: auth.user.id,
    actorUserId: auth.user.id,
  });

  return NextResponse.json({
    success: true,
    run,
    message: "Export generated as JSON manifest. Connect PDF assembly to this run id when ready.",
  });
}
