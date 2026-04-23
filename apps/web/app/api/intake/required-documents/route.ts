import { NextRequest, NextResponse } from "next/server";
import type { RequiredDocumentCategory } from "@prisma/client";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { prisma } from "@repo/db";
import { getBrokerClientForIntake, requireIntakeUser } from "@/modules/intake/services/api-helpers";
import {
  canManageRequiredDocuments,
  canViewIntakeProfile,
} from "@/modules/intake/services/intake-permissions";
import { logIntakeEvent } from "@/modules/intake/services/log-intake-event";
import { calculateChecklistProgress } from "@/modules/intake/services/calculate-checklist-progress";

export const dynamic = "force-dynamic";

const CATEGORIES = new Set<string>([
  "IDENTITY",
  "INCOME",
  "BANKING",
  "TAX",
  "RESIDENCY",
  "CREDIT",
  "EMPLOYMENT",
  "CORPORATE",
  "PROPERTY",
  "OTHER",
]);

/**
 * GET /api/intake/required-documents?brokerClientId=
 */
export async function GET(request: NextRequest) {
  const user = await requireIntakeUser(request);
  if (user instanceof NextResponse) return user;

  const brokerClientId = request.nextUrl.searchParams.get("brokerClientId")?.trim();
  if (!brokerClientId) {
    return NextResponse.json({ error: "brokerClientId query required" }, { status: 400 });
  }

  const bc = await getBrokerClientForIntake(brokerClientId);
  if (!bc) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
  if (!canViewIntakeProfile({ id: user.userId, role: user.role }, bc)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  return NextResponse.json({
    items,
    progress: calculateChecklistProgress(items),
  });
}

/**
 * POST /api/intake/required-documents — create a checklist row (broker/admin).
 */
export async function POST(request: NextRequest) {
  const user = await requireIntakeUser(request);
  if (user instanceof NextResponse) return user;

  const body = (await request.json().catch(() => null)) as {
    brokerClientId?: string;
    title?: string;
    category?: string;
    description?: string | null;
    isMandatory?: boolean;
    dueAt?: string | null;
    intakeProfileId?: string | null;
  } | null;

  const brokerClientId = body?.brokerClientId?.trim();
  const title = body?.title?.trim();
  const cat = body?.category?.trim();

  if (!brokerClientId || !title || !cat || !CATEGORIES.has(cat)) {
    return NextResponse.json(
      { error: "brokerClientId, title, and valid category are required" },
      { status: 400 }
    );
  }

  const bc = await getBrokerClientForIntake(brokerClientId);
  if (!bc) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
  if (!canManageRequiredDocuments({ id: user.userId, role: user.role }, bc)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let dueAt: Date | undefined;
  if (body?.dueAt) {
    const d = new Date(body.dueAt);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid dueAt" }, { status: 400 });
    }
    dueAt = d;
  }

  const item = await prisma.requiredDocumentItem.create({
    data: {
      brokerClientId,
      intakeProfileId: body?.intakeProfileId ?? bc.intakeProfile?.id ?? undefined,
      title,
      description: body?.description?.trim() || undefined,
      category: cat as RequiredDocumentCategory,
      isMandatory: body?.isMandatory !== false,
      status: "REQUIRED",
      dueAt,
    },
  });

  await logIntakeEvent({
    type: "DOCUMENT_REQUESTED",
    brokerClientId,
    intakeProfileId: item.intakeProfileId,
    requiredDocumentItemId: item.id,
    actorId: user.userId,
    message: title,
  });

  void trackDemoEvent(
    DemoEvents.REQUIRED_DOCUMENT_REQUESTED,
    { category: item.category },
    user.userId
  );

  return NextResponse.json({ item });
}
