import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";
import { HostGrowthOutreachChannel, HostGrowthOutreachStatus } from "@prisma/client";
import { engineFlags } from "@/config/feature-flags";
import { logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  leadId: z.string().trim().min(8).max(48),
  channel: z.enum(["email", "sms", "dm", "other"]),
  message: z.string().trim().min(1).max(12000),
  response: z.string().max(12000).optional(),
  status: z.enum(["sent", "delivered", "replied", "failed"]).optional(),
});

/**
 * POST /api/leads/outreach — log outreach against a ListingAcquisitionLead (admin only).
 */
export async function POST(req: Request) {
  if (!engineFlags.hostAcquisitionV1) {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const admin = await isPlatformAdmin(userId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const lead = await prisma.listingAcquisitionLead.findUnique({
    where: { id: parsed.data.leadId },
    select: { id: true },
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const channelByInput = {
    email: HostGrowthOutreachChannel.email,
    sms: HostGrowthOutreachChannel.sms,
    dm: HostGrowthOutreachChannel.dm,
    other: HostGrowthOutreachChannel.other,
  } as const;
  const ch = channelByInput[parsed.data.channel];

  const status =
    parsed.data.status === "delivered"
      ? HostGrowthOutreachStatus.delivered
      : parsed.data.status === "replied"
        ? HostGrowthOutreachStatus.replied
        : parsed.data.status === "failed"
          ? HostGrowthOutreachStatus.failed
          : HostGrowthOutreachStatus.sent;

  const row = await prisma.hostGrowthOutreachLog.create({
    data: {
      leadId: lead.id,
      channel: ch,
      message: parsed.data.message,
      response: parsed.data.response?.trim() || null,
      status,
      createdById: userId,
    },
  });

  logInfo("host_growth_outreach_logged", { leadId: lead.id, outreachId: row.id });

  return NextResponse.json({ ok: true, id: row.id });
}
