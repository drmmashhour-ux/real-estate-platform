import { NextRequest, NextResponse } from "next/server";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getBrokerClientForIntake, requireIntakeUser } from "@/modules/intake/services/api-helpers";
import { calculateChecklistProgress } from "@/modules/intake/services/calculate-checklist-progress";
import { canEditIntakeProfile, canViewIntakeProfile } from "@/modules/intake/services/intake-permissions";
import { logIntakeEvent } from "@/modules/intake/services/log-intake-event";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ brokerClientId: string }> };

function parseFloatOrNull(v: unknown): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() === "") return null;
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function parseDateOrNull(v: unknown): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  const d = v instanceof Date ? v : new Date(String(v));
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

/**
 * GET /api/intake/profile/[brokerClientId]
 * Ensures profile exists when viewer is allowed (lazy create for linked client).
 */
export async function GET(request: NextRequest, ctx: RouteCtx) {
  const user = await requireIntakeUser(request);
  if (user instanceof NextResponse) return user;

  const { brokerClientId } = await ctx.params;
  const bc = await getBrokerClientForIntake(brokerClientId);
  if (!bc) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
  if (!canViewIntakeProfile({ id: user.userId, role: user.role }, bc)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let profile = bc.intakeProfile;
  if (!profile) {
    profile = await prisma.clientIntakeProfile.create({
      data: {
        brokerClientId,
        userId: bc.userId ?? undefined,
      },
    });
    await logIntakeEvent({
      type: "INTAKE_CREATED",
      brokerClientId,
      intakeProfileId: profile.id,
      actorId: user.userId,
      message: "Intake profile created",
    });
    void trackDemoEvent(
      DemoEvents.INTAKE_PROFILE_CREATED,
      { brokerClientId },
      user.userId
    );
  }

  const items = await prisma.requiredDocumentItem.findMany({
    where: { brokerClientId, deletedAt: null },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
    include: {
      linkedDocumentFile: {
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  const events = await prisma.clientIntakeEvent.findMany({
    where: { brokerClientId },
    orderBy: { createdAt: "desc" },
    take: 80,
    include: {
      actor: { select: { id: true, name: true, email: true } },
    },
  });

  const progress = calculateChecklistProgress(items);

  return NextResponse.json({
    brokerClient: {
      id: bc.id,
      fullName: bc.fullName,
      email: bc.email,
      phone: bc.phone,
      brokerId: bc.brokerId,
      userId: bc.userId,
    },
    profile,
    items,
    events,
    progress,
  });
}

/**
 * PATCH /api/intake/profile/[brokerClientId]
 */
export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  const user = await requireIntakeUser(request);
  if (user instanceof NextResponse) return user;

  const { brokerClientId } = await ctx.params;
  const bc = await getBrokerClientForIntake(brokerClientId);
  if (!bc) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
  if (!canEditIntakeProfile({ id: user.userId, role: user.role }, bc)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const isBrokerSide =
    user.role === "ADMIN" || bc.brokerId === user.userId;

  const data: Record<string, unknown> = {};
  const stringFields = [
    "legalFirstName",
    "legalLastName",
    "phone",
    "email",
    "employmentStatus",
    "residencyStatus",
    "citizenshipCountry",
    "maritalStatus",
    "city",
    "provinceState",
    "postalCode",
    "country",
    "currentAddress",
  ] as const;

  for (const k of stringFields) {
    if (k in body) {
      const v = body[k];
      data[k] = v === null || v === undefined ? null : String(v).trim() || null;
    }
  }

  const dob = parseDateOrNull(body.dateOfBirth);
  if (dob !== undefined) data.dateOfBirth = dob;

  for (const k of ["annualIncome", "estimatedAssets", "estimatedLiabilities"] as const) {
    if (k in body) {
      const n = parseFloatOrNull(body[k]);
      if (n === undefined) {
        return NextResponse.json({ error: `Invalid ${k}` }, { status: 400 });
      }
      data[k] = n;
    }
  }

  if ("notes" in body && isBrokerSide) {
    const v = body.notes;
    data.notes = v === null || v === undefined ? null : String(v);
  }

  let profile = bc.intakeProfile;
  if (!profile) {
    profile = await prisma.clientIntakeProfile.create({
      data: {
        brokerClientId,
        userId: bc.userId ?? undefined,
      },
    });
    await logIntakeEvent({
      type: "INTAKE_CREATED",
      brokerClientId,
      intakeProfileId: profile.id,
      actorId: user.userId,
      message: "Intake profile created",
    });
  }

  const updated = await prisma.clientIntakeProfile.update({
    where: { id: profile.id },
    data: data as object,
  });

  await logIntakeEvent({
    type: "INTAKE_UPDATED",
    brokerClientId,
    intakeProfileId: updated.id,
    actorId: user.userId,
    message: "Intake profile updated",
  });

  return NextResponse.json({ profile: updated });
}
