import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@repo/db";
import { asInputJsonValue } from "@/lib/prisma/as-input-json";
import { hostEconomicsFlags } from "@/config/feature-flags";

const BodyZ = z.object({
  userId: z.string().optional(),
  leadId: z.string().optional(),
  listingId: z.string().optional(),
  input: z.record(z.string(), z.unknown()),
  output: z.record(z.string(), z.unknown()),
});

export const dynamic = "force-dynamic";

/** POST /api/internal/roi/save — admin tooling. */
export async function POST(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!hostEconomicsFlags.roiCalculatorV1) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const row = await prisma.roiCalculation.create({
    data: {
      userId: parsed.data.userId ?? null,
      leadId: parsed.data.leadId ?? null,
      listingId: parsed.data.listingId ?? null,
      input: asInputJsonValue(parsed.data.input),
      output: asInputJsonValue(parsed.data.output),
    },
  });

  return NextResponse.json({ ok: true, id: row.id });
}
