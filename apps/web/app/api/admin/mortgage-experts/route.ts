import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import type { Prisma } from "@prisma/client";
import { prisma } from "@repo/db";
import { getMortgagePlanDefaults } from "@/modules/mortgage/services/subscription-plans";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const id = await getGuestId();
  if (!id) return { ok: false as const, status: 401, error: "Sign in required" };
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (u?.role !== "ADMIN") return { ok: false as const, status: 403, error: "Admin only" };
  return { ok: true as const };
}

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  try {
    const experts = await prisma.mortgageExpert.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, role: true, accountStatus: true } },
        expertSubscription: true,
        expertCredits: true,
      },
    });
    return NextResponse.json({ experts });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const data: Prisma.MortgageExpertUpdateInput = {};
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.isAvailable === "boolean") data.isAvailable = body.isAvailable;
  if (typeof body.commissionRate === "number" && Number.isFinite(body.commissionRate)) {
    data.commissionRate = Math.min(1, Math.max(0, body.commissionRate));
  }
  if (typeof body.adminRatingBoost === "number" && Number.isFinite(body.adminRatingBoost)) {
    data.adminRatingBoost = Math.min(5, Math.max(-5, body.adminRatingBoost));
  }
  if (typeof body.maxLeadsPerDay === "number" && body.maxLeadsPerDay > 0 && body.maxLeadsPerDay <= 500) {
    data.maxLeadsPerDay = Math.round(body.maxLeadsPerDay);
  }
  if (typeof body.rating === "number" && body.rating >= 1 && body.rating <= 5) {
    data.rating = body.rating;
  }
  if (typeof body.expertVerificationStatus === "string") {
    const v = body.expertVerificationStatus.trim().toLowerCase();
    if (["profile_incomplete", "pending_review", "verified", "rejected"].includes(v)) {
      data.expertVerificationStatus = v;
      if (v === "verified") {
        data.isActive = true;
        data.isAvailable = true;
      }
      if (v === "rejected") {
        data.isActive = false;
      }
    }
  }

  const hasExpertFields = Object.keys(data).length > 0;
  const subscriptionPlan =
    typeof body.subscriptionPlan === "string" ? body.subscriptionPlan.trim().toLowerCase() : "";
  const creditsRaw = body.expertCredits;
  const hasCredits =
    creditsRaw !== undefined && creditsRaw !== null && Number.isFinite(Number(creditsRaw));

  if (!hasExpertFields && !subscriptionPlan && !hasCredits) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
  }

  try {
    let updated = await prisma.mortgageExpert.findUnique({ where: { id } });
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (hasExpertFields) {
      updated = await prisma.mortgageExpert.update({ where: { id }, data });
    }

    if (subscriptionPlan && ["basic", "pro", "premium", "ambassador"].includes(subscriptionPlan)) {
      const defs = getMortgagePlanDefaults(subscriptionPlan);
      await prisma.expertSubscription.upsert({
        where: { expertId: id },
        create: {
          expertId: id,
          plan: subscriptionPlan,
          price: defs.price,
          maxLeadsPerDay: defs.maxLeadsPerDay,
          maxLeadsPerMonth: defs.maxLeadsPerMonth,
          priorityWeight: defs.priorityWeight,
          isActive: true,
        },
        update: {
          plan: subscriptionPlan,
          price: defs.price,
          maxLeadsPerDay: defs.maxLeadsPerDay,
          maxLeadsPerMonth: defs.maxLeadsPerMonth,
          priorityWeight: defs.priorityWeight,
          isActive: true,
        },
      });
    }

    if (hasCredits) {
      const credits = Math.max(0, Math.min(1_000_000, Math.round(Number(creditsRaw))));
      await prisma.expertCredits.upsert({
        where: { expertId: id },
        create: { expertId: id, credits },
        update: { credits },
      });
    }

    const expert = await prisma.mortgageExpert.findUnique({
      where: { id },
      include: { expertSubscription: true, expertCredits: true, user: { select: { email: true } } },
    });
    return NextResponse.json({ ok: true, expert });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
