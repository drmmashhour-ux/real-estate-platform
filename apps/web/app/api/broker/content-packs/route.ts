import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { formatFormActivityNote } from "@/lib/forms/form-activity";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { userId } = await requireAuthenticatedUser();
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId") ?? "";

    const rows = await prisma.formSubmission.findMany({
      where: {
        formType: "broker_content_pack",
        assignedTo: userId,
      },
      select: {
        id: true,
        payloadJson: true,
        createdAt: true,
        activities: {
          select: {
            action: true,
            note: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const items = rows
      .map((row) => {
        const payload = (row.payloadJson ?? {}) as Record<string, unknown>;
        return {
          id: row.id,
          title: typeof payload.title === "string" ? payload.title : "Saved content pack",
          listingId: typeof payload.listingId === "string" ? payload.listingId : null,
          listingTitle: typeof payload.listingTitle === "string" ? payload.listingTitle : null,
          tone: typeof payload.tone === "string" ? payload.tone : null,
          output: typeof payload.output === "string" ? payload.output : null,
          language: typeof payload.language === "string" ? payload.language : null,
          folder: typeof payload.folder === "string" ? payload.folder : null,
          campaignStatus: typeof payload.campaignStatus === "string" ? payload.campaignStatus : "draft",
          plannedFor: typeof payload.plannedFor === "string" ? payload.plannedFor : null,
          reminderHoursBefore:
            typeof payload.reminderHoursBefore === "number" ? payload.reminderHoursBefore : null,
          reminderDismissedAt: typeof payload.reminderDismissedAt === "string" ? payload.reminderDismissedAt : null,
          isFavorite: Boolean(payload.isFavorite),
          lastUsedAt: typeof payload.lastUsedAt === "string" ? payload.lastUsedAt : null,
          tags: Array.isArray(payload.tags) ? payload.tags : [],
          cards: Array.isArray(payload.cards) ? payload.cards : [],
          createdAt: row.createdAt.toISOString(),
          latestActivityAt: row.activities[0]?.createdAt.toISOString() ?? null,
          latestActivityNote: row.activities[0]?.note ?? null,
          latestActivityAction: row.activities[0]?.action ?? null,
          activityHistory: row.activities.map((activity) => ({
            action: activity.action,
            note: activity.note ?? null,
            createdAt: activity.createdAt.toISOString(),
          })),
        };
      })
      .filter((item) => !listingId || item.listingId === listingId);

    return NextResponse.json({ packs: items });
  } catch (error) {
    console.error("GET /api/broker/content-packs:", error);
    return NextResponse.json({ packs: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuthenticatedUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const listingId = typeof body?.listingId === "string" ? body.listingId : "";
    const listingTitle = typeof body?.listingTitle === "string" ? body.listingTitle : "";
    const tone = typeof body?.tone === "string" ? body.tone : "";
    const output = typeof body?.output === "string" ? body.output : "";
    const language = typeof body?.language === "string" ? body.language : "";
    const folder = typeof body?.folder === "string" ? body.folder.trim() : "";
    const campaignStatus = typeof body?.campaignStatus === "string" ? body.campaignStatus : "draft";
    const plannedFor = typeof body?.plannedFor === "string" ? body.plannedFor : null;
    const reminderHoursBefore =
      typeof body?.reminderHoursBefore === "number" ? body.reminderHoursBefore : null;
    const reminderDismissedAt = typeof body?.reminderDismissedAt === "string" ? body.reminderDismissedAt : null;
    const isFavorite = Boolean(body?.isFavorite);
    const lastUsedAt = typeof body?.lastUsedAt === "string" ? body.lastUsedAt : null;
    const tags = Array.isArray(body?.tags) ? body.tags.filter((tag): tag is string => typeof tag === "string") : [];
    const cards = Array.isArray(body?.cards) ? body.cards : [];

    if (!listingId || !listingTitle || cards.length === 0) {
      return NextResponse.json({ error: "listingId, listingTitle, and cards are required." }, { status: 400 });
    }

    const payload = {
      listingId,
      listingTitle,
      tone,
      output,
      language,
      folder,
      campaignStatus,
      plannedFor,
      reminderHoursBefore,
      reminderDismissedAt,
      isFavorite,
      lastUsedAt,
      tags,
      title: `${listingTitle} · ${tone || "content"} · ${output || "pack"}`,
      cards,
      savedAt: new Date().toISOString(),
    };

    const submission = await prisma.formSubmission.create({
      data: {
        formType: "broker_content_pack",
        status: "draft",
        assignedTo: userId,
        payloadJson: payload as Prisma.InputJsonValue,
      },
    });

    await prisma.formActivity.create({
      data: {
        formSubmissionId: submission.id,
        action: "created",
        note: formatFormActivityNote("Broker", `Saved broker content pack for listing ${listingId}`),
      },
    });

    return NextResponse.json({ ok: true, id: submission.id });
  } catch (error) {
    console.error("POST /api/broker/content-packs:", error);
    return NextResponse.json({ error: "Failed to save content pack." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await requireAuthenticatedUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const id = typeof body?.id === "string" ? body.id : "";
    const listingId = typeof body?.listingId === "string" ? body.listingId : "";
    const listingTitle = typeof body?.listingTitle === "string" ? body.listingTitle : "";
    const titleOverride = typeof body?.title === "string" ? body.title.trim() : "";
    const tone = typeof body?.tone === "string" ? body.tone : "";
    const output = typeof body?.output === "string" ? body.output : "";
    const language = typeof body?.language === "string" ? body.language : "";
    const folder = typeof body?.folder === "string" ? body.folder.trim() : "";
    const campaignStatus = typeof body?.campaignStatus === "string" ? body.campaignStatus : "draft";
    const plannedFor = typeof body?.plannedFor === "string" ? body.plannedFor : null;
    const reminderHoursBefore =
      typeof body?.reminderHoursBefore === "number" ? body.reminderHoursBefore : null;
    const reminderDismissedAt = typeof body?.reminderDismissedAt === "string" ? body.reminderDismissedAt : null;
    const isFavorite = Boolean(body?.isFavorite);
    const lastUsedAt = typeof body?.lastUsedAt === "string" ? body.lastUsedAt : null;
    const tags = Array.isArray(body?.tags) ? body.tags.filter((tag): tag is string => typeof tag === "string") : [];
    const cards = Array.isArray(body?.cards) ? body.cards : [];

    if (!id || !listingId || !listingTitle || cards.length === 0) {
      return NextResponse.json({ error: "id, listingId, listingTitle, and cards are required." }, { status: 400 });
    }

    const existing = await prisma.formSubmission.findFirst({
      where: {
        id,
        formType: "broker_content_pack",
        assignedTo: userId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Content pack not found." }, { status: 404 });
    }

    const payload = {
      listingId,
      listingTitle,
      tone,
      output,
      language,
      folder,
      campaignStatus,
      plannedFor,
      reminderHoursBefore,
      reminderDismissedAt,
      isFavorite,
      lastUsedAt,
      tags,
      title: titleOverride || `${listingTitle} · ${tone || "content"} · ${output || "pack"}`,
      cards,
      savedAt: new Date().toISOString(),
    };

    await prisma.formSubmission.update({
      where: { id },
      data: {
        payloadJson: payload as Prisma.InputJsonValue,
      },
    });

    await prisma.formActivity.create({
      data: {
        formSubmissionId: id,
        action: "updated",
        note: formatFormActivityNote("Broker", `Updated broker content pack for listing ${listingId}`),
      },
    });

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("PATCH /api/broker/content-packs:", error);
    return NextResponse.json({ error: "Failed to update content pack." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await requireAuthenticatedUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") ?? "";

    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const existing = await prisma.formSubmission.findFirst({
      where: {
        id,
        formType: "broker_content_pack",
        assignedTo: userId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Content pack not found." }, { status: 404 });
    }

    await prisma.formSubmission.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/broker/content-packs:", error);
    return NextResponse.json({ error: "Failed to delete content pack." }, { status: 500 });
  }
}
