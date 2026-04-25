import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PlatformRole } from "@prisma/client";

export const dynamic = "force-dynamic";

const putSchema = z.object({
  displayName: z.string().min(1).max(200).optional(),
  phone: z.string().min(5).max(40).optional().nullable(),
  markets: z.array(z.string().min(1).max(120)).max(24).optional(),
  specializations: z.array(z.string().min(1).max(64)).max(24).optional(),
  goals: z
    .object({
      seekLeads: z.boolean().optional(),
      seekDeals: z.boolean().optional(),
    })
    .optional(),
  complete: z.boolean().optional(),
  firstValueShown: z.boolean().optional(),
  referredByBrokerId: z.string().uuid().optional().nullable(),
});

async function requireBrokerUser() {
  const id = await getGuestId();
  if (!id) return { error: { status: 401 as const, message: "Sign in required" } };
  const u = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!u || (u.role !== PlatformRole.BROKER && u.role !== PlatformRole.ADMIN)) {
    return { error: { status: 403 as const, message: "Broker access only" } };
  }
  return { user: u };
}

export async function GET() {
  const a = await requireBrokerUser();
  if ("error" in a) return NextResponse.json({ error: a.error.message }, { status: a.error.status });
  const row = await prisma.brokerProfile.findUnique({ where: { userId: a.user.id } });
  return NextResponse.json({ profile: row });
}

export async function PUT(req: NextRequest) {
  const a = await requireBrokerUser();
  if ("error" in a) return NextResponse.json({ error: a.error.message }, { status: a.error.status });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const p = putSchema.safeParse(body);
  if (!p.success) {
    return NextResponse.json({ error: p.error.flatten().formErrors.join("; ") }, { status: 400 });
  }
  const { displayName, phone, markets, specializations, goals, complete, firstValueShown, referredByBrokerId } = p.data;
  const now = new Date();
  const data = {
    displayName: displayName?.trim() ?? undefined,
    phone: phone === undefined ? undefined : phone?.trim() ?? null,
    marketsJson: markets === undefined ? undefined : (markets as object),
    specializations: specializations === undefined ? undefined : specializations,
    goalsJson: goals === undefined ? undefined : (goals as object),
    referredByBrokerId: referredByBrokerId === undefined ? undefined : referredByBrokerId,
    ...(complete ? { onboardingCompletedAt: now } : {}),
    ...(firstValueShown ? { firstValueShownAt: now } : {}),
  };
  const row = await prisma.brokerProfile.upsert({
    where: { userId: a.user.id },
    create: {
      userId: a.user.id,
      displayName: displayName?.trim() ?? "Broker",
      phone: phone?.trim() ?? null,
      marketsJson: (markets as object) ?? undefined,
      specializations: specializations ?? [],
      goalsJson: (goals as object) ?? undefined,
      referredByBrokerId: referredByBrokerId ?? null,
      onboardingCompletedAt: complete ? now : null,
      firstValueShownAt: firstValueShown ? now : null,
    },
    update: data,
  });
  return NextResponse.json({ profile: row });
}
