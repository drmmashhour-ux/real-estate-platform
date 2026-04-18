import { NextResponse } from "next/server";
import { z } from "zod";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  pipelineStatus: z.string().min(1).max(64).optional(),
  pipelineStage: z.string().min(1).max(64).optional(),
});

async function canAccessLead(actor: { userId: string; role: PlatformRole }, leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { introducedByBrokerId: true, fsboListingId: true, userId: true },
  });
  if (!lead) return null;
  if (actor.role === PlatformRole.ADMIN || actor.role === PlatformRole.ACCOUNTANT) return lead;
  if (actor.role === PlatformRole.BROKER && lead.introducedByBrokerId === actor.userId) return lead;
  if (lead.userId === actor.userId) return lead;
  if (lead.fsboListingId) {
    const listing = await prisma.fsboListing.findUnique({
      where: { id: lead.fsboListingId },
      select: { ownerId: true },
    });
    if (listing?.ownerId === actor.userId) return lead;
  }
  return null;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const lead = await canAccessLead(auth, id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join("; ") }, { status: 400 });
  }

  await prisma.lead.update({
    where: { id },
    data: {
      ...(parsed.data.pipelineStatus ? { pipelineStatus: parsed.data.pipelineStatus } : {}),
      ...(parsed.data.pipelineStage ? { pipelineStage: parsed.data.pipelineStage } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
