import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@repo/db";
import { getSessionUserIdFromRequest } from "@/lib/auth/api-session";
import { isPlatformAdminSurface } from "@/lib/auth/is-platform-admin";

const PatchZ = z.object({
  activeMarketCode: z.string().min(1).max(32).optional(),
  syriaModeEnabled: z.boolean().optional(),
  onlinePaymentsEnabled: z.boolean().optional(),
  manualPaymentTrackingEnabled: z.boolean().optional(),
  contactFirstEmphasis: z.boolean().optional(),
  defaultDisplayCurrency: z.string().min(3).max(8).optional(),
});

export async function GET(request: NextRequest) {
  const userId = await getSessionUserIdFromRequest(request);
  if (!(await isPlatformAdminSurface(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const row = await prisma.platformMarketLaunchSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
  return NextResponse.json(row);
}

export async function PATCH(request: NextRequest) {
  const userId = await getSessionUserIdFromRequest(request);
  if (!(await isPlatformAdminSurface(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const json = await request.json().catch(() => null);
  const parsed = PatchZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const entries = Object.entries(parsed.data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }
  const patch = Object.fromEntries(entries) as Record<string, unknown>;
  const row = await prisma.platformMarketLaunchSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...patch },
    update: patch,
  });
  return NextResponse.json(row);
}
