import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { LegalPacketLink } from "@/components/admin/LegalPacketLink";
import { HubLayout } from "@/components/hub/HubLayout";
import { prisma } from "@/lib/db";
import { formatFormActivityNote } from "@/lib/forms/form-activity";
import { hubNavigation } from "@/lib/hub/navigation";

export const dynamic = "force-dynamic";

type ReminderItem = {
  id: string;
  assignedTo: string | null;
  brokerName: string;
  brokerEmail: string;
  title: string;
  folder: string;
  campaignStatus: string;
  plannedFor: Date | null;
  reminderAt: Date | null;
  reminderHoursBefore: number | null;
  reminderDismissedAt: string | null;
  adminReviewedAt: string | null;
  adminReviewedBy: string | null;
  adminReviewNote: string | null;
  latestActivityAction: string | null;
  latestActivityNote: string | null;
  latestActivityAt: string | null;
  activityHistory: Array<{
    action: string;
    note: string | null;
    createdAt: string;
  }>;
};

type BrokerDirectoryEntry = {
  name: string;
  email: string;
};

async function getBrokerDirectory(assignedToValues: Array<string | null | undefined>) {
  const brokerIds = Array.from(
    new Set(assignedToValues.filter((value): value is string => typeof value === "string" && value.length > 0))
  );

  if (brokerIds.length === 0) {
    return new Map<string, BrokerDirectoryEntry>();
  }

  const brokers = await prisma.user.findMany({
    where: { id: { in: brokerIds } },
    select: { id: true, name: true, email: true },
  });

  return new Map<string, BrokerDirectoryEntry>(
    brokers.map((broker) => [
      broker.id,
      {
        name: broker.name ?? "Unknown broker",
        email: broker.email ?? "No email",
      },
    ])
  );
}

async function updateReviewState(formData: FormData) {
  "use server";

  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/content-ops");

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/admin");

  const submissionId = String(formData.get("submissionId") ?? "");
  const mode = String(formData.get("mode") ?? "");
  if (!submissionId || (mode !== "review" && mode !== "clear")) return;

  const existing = await prisma.formSubmission.findFirst({
    where: {
      id: submissionId,
      formType: "broker_content_pack",
    },
    select: {
      payloadJson: true,
    },
  });

  if (!existing) return;

  const payload = { ...((existing.payloadJson ?? {}) as Record<string, unknown>) };
  const reviewNote = String(formData.get("reviewNote") ?? "").trim();
  if (mode === "review") {
    payload.adminReviewedAt = new Date().toISOString();
    payload.adminReviewedBy = userId;
    payload.adminReviewNote = reviewNote || null;
  } else {
    delete payload.adminReviewedAt;
    delete payload.adminReviewedBy;
    delete payload.adminReviewNote;
  }

  await prisma.formSubmission.update({
    where: { id: submissionId },
    data: {
      payloadJson: payload as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/admin/content-ops");
  revalidatePath("/admin/dashboard");
}

async function addAdminActivityNote(formData: FormData) {
  "use server";

  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/content-ops");

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/admin");

  const submissionId = String(formData.get("submissionId") ?? "");
  const note = String(formData.get("adminNote") ?? "").trim();
  if (!submissionId || !note) return;

  const existing = await prisma.formSubmission.findFirst({
    where: {
      id: submissionId,
      formType: "broker_content_pack",
    },
    select: { id: true, assignedTo: true },
  });
  if (!existing) return;

  await prisma.formActivity.create({
    data: {
      formSubmissionId: submissionId,
      action: "updated",
      note: formatFormActivityNote("Admin", `Legal/admin note: ${note}`),
    },
  });

  revalidatePath("/admin/content-ops");
  if (existing.assignedTo) {
    revalidatePath(`/admin/content-ops/brokers/${existing.assignedTo}`);
  }
  revalidatePath("/admin/dashboard");
}

async function bulkReviewFilteredItems(formData: FormData) {
  "use server";

  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/content-ops");

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/admin");

  const brokerQuery = String(formData.get("broker") ?? "").trim().toLowerCase();
  const stateFilter = String(formData.get("state") ?? "all");
  const reviewFilter = String(formData.get("review") ?? "all");
  const actorFilter = String(formData.get("actor") ?? "all");
  const noteQuery = String(formData.get("note") ?? "").trim().toLowerCase();
  const fromFilter = String(formData.get("from") ?? "");
  const toFilter = String(formData.get("to") ?? "");
  const reviewNote = String(formData.get("reviewNote") ?? "").trim();

  const rows = await prisma.formSubmission.findMany({
    where: { formType: "broker_content_pack" },
    select: {
      id: true,
      assignedTo: true,
      payloadJson: true,
      activities: {
        select: {
          action: true,
          note: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    take: 250,
  });
  const brokerDirectory = await getBrokerDirectory(rows.map((row) => row.assignedTo));

  const now = new Date();
  const matches = rows.filter((row) => {
    const payload = (row.payloadJson ?? {}) as Record<string, unknown>;
    const plannedFor = typeof payload.plannedFor === "string" ? new Date(payload.plannedFor) : null;
    const reminderHoursBefore =
      typeof payload.reminderHoursBefore === "number" ? payload.reminderHoursBefore : null;
    const reminderAt =
      plannedFor && reminderHoursBefore != null
        ? new Date(plannedFor.getTime() - reminderHoursBefore * 60 * 60 * 1000)
        : null;
    const campaignStatus = typeof payload.campaignStatus === "string" ? payload.campaignStatus : "draft";
    const reminderDismissedAt =
      typeof payload.reminderDismissedAt === "string" ? payload.reminderDismissedAt : null;
    const adminReviewedAt = typeof payload.adminReviewedAt === "string" ? payload.adminReviewedAt : null;
    const adminReviewNote = typeof payload.adminReviewNote === "string" ? payload.adminReviewNote : null;
    const broker = row.assignedTo ? brokerDirectory.get(row.assignedTo) : null;
    const brokerName = broker?.name ?? "Unknown broker";
    const brokerEmail = broker?.email ?? "No email";
    const latestActivity = row.activities[0];

    if (
      campaignStatus !== "planned" ||
      !plannedFor ||
      !reminderAt ||
      Number.isNaN(plannedFor.getTime()) ||
      Number.isNaN(reminderAt.getTime())
    ) {
      return false;
    }

    const matchesBroker =
      !brokerQuery || brokerName.toLowerCase().includes(brokerQuery) || brokerEmail.toLowerCase().includes(brokerQuery);
    const isDismissed = reminderDismissedAt != null;
    const isDue = !isDismissed && reminderAt.getTime() <= now.getTime();
    const matchesState =
      stateFilter === "all" ||
      (stateFilter === "due" && isDue) ||
      (stateFilter === "upcoming" && !isDismissed && !isDue) ||
      (stateFilter === "dismissed" && isDismissed);
    const isReviewed = adminReviewedAt != null;
    const matchesReview =
      reviewFilter === "all" ||
      (reviewFilter === "reviewed" && isReviewed) ||
      (reviewFilter === "unreviewed" && !isReviewed);
    const matchesNote = !noteQuery || (adminReviewNote ?? "").toLowerCase().includes(noteQuery);
    const fromDate = fromFilter ? new Date(`${fromFilter}T00:00:00`) : null;
    const toDate = toFilter ? new Date(`${toFilter}T23:59:59`) : null;
    const matchesFrom = !fromDate || plannedFor.getTime() >= fromDate.getTime();
    const matchesTo = !toDate || plannedFor.getTime() <= toDate.getTime();

    const actor = getActivityActor(latestActivity?.note ?? null, latestActivity?.action ?? null);
    const matchesActor = actorFilter === "all" || actor === actorFilter;

    return matchesBroker && matchesState && matchesReview && matchesActor && matchesNote && matchesFrom && matchesTo;
  });

  await Promise.all(
    matches.map(async (row) => {
      const payload = { ...((row.payloadJson ?? {}) as Record<string, unknown>) };
      payload.adminReviewedAt = new Date().toISOString();
      payload.adminReviewedBy = userId;
      payload.adminReviewNote = reviewNote || "Bulk reviewed from admin content ops";

      await prisma.formSubmission.update({
        where: { id: row.id },
        data: { payloadJson: payload as Prisma.InputJsonValue },
      });

      await prisma.formActivity.create({
        data: {
          formSubmissionId: row.id,
          action: "updated",
          note: formatFormActivityNote("Admin", `Bulk reviewed from content ops${reviewNote ? `: ${reviewNote}` : ""}`),
        },
      });
    })
  );

  revalidatePath("/admin/content-ops");
  revalidatePath("/admin/dashboard");
}

async function dismissFilteredReminders(formData: FormData) {
  "use server";

  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/content-ops");

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/admin");

  const brokerQuery = String(formData.get("broker") ?? "").trim().toLowerCase();
  const stateFilter = String(formData.get("state") ?? "all");
  const reviewFilter = String(formData.get("review") ?? "all");
  const actorFilter = String(formData.get("actor") ?? "all");
  const noteQuery = String(formData.get("note") ?? "").trim().toLowerCase();
  const fromFilter = String(formData.get("from") ?? "");
  const toFilter = String(formData.get("to") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (confirmation !== "CONFIRM") return;

  const rows = await prisma.formSubmission.findMany({
    where: { formType: "broker_content_pack" },
    select: {
      id: true,
      assignedTo: true,
      payloadJson: true,
      activities: {
        select: {
          action: true,
          note: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    take: 250,
  });
  const brokerDirectory = await getBrokerDirectory(rows.map((row) => row.assignedTo));

  const now = new Date();
  const matches = rows.filter((row) => {
    const payload = (row.payloadJson ?? {}) as Record<string, unknown>;
    const plannedFor = typeof payload.plannedFor === "string" ? new Date(payload.plannedFor) : null;
    const reminderHoursBefore =
      typeof payload.reminderHoursBefore === "number" ? payload.reminderHoursBefore : null;
    const reminderAt =
      plannedFor && reminderHoursBefore != null
        ? new Date(plannedFor.getTime() - reminderHoursBefore * 60 * 60 * 1000)
        : null;
    const campaignStatus = typeof payload.campaignStatus === "string" ? payload.campaignStatus : "draft";
    const reminderDismissedAt =
      typeof payload.reminderDismissedAt === "string" ? payload.reminderDismissedAt : null;
    const adminReviewedAt = typeof payload.adminReviewedAt === "string" ? payload.adminReviewedAt : null;
    const adminReviewNote = typeof payload.adminReviewNote === "string" ? payload.adminReviewNote : null;
    const broker = row.assignedTo ? brokerDirectory.get(row.assignedTo) : null;
    const brokerName = broker?.name ?? "Unknown broker";
    const brokerEmail = broker?.email ?? "No email";
    const latestActivity = row.activities[0];

    if (
      campaignStatus !== "planned" ||
      !plannedFor ||
      !reminderAt ||
      Number.isNaN(plannedFor.getTime()) ||
      Number.isNaN(reminderAt.getTime())
    ) {
      return false;
    }

    const matchesBroker =
      !brokerQuery || brokerName.toLowerCase().includes(brokerQuery) || brokerEmail.toLowerCase().includes(brokerQuery);
    const isDismissed = reminderDismissedAt != null;
    const isDue = !isDismissed && reminderAt.getTime() <= now.getTime();
    const matchesState =
      stateFilter === "all" ||
      (stateFilter === "due" && isDue) ||
      (stateFilter === "upcoming" && !isDismissed && !isDue) ||
      (stateFilter === "dismissed" && isDismissed);
    const isReviewed = adminReviewedAt != null;
    const matchesReview =
      reviewFilter === "all" ||
      (reviewFilter === "reviewed" && isReviewed) ||
      (reviewFilter === "unreviewed" && !isReviewed);
    const matchesNote = !noteQuery || (adminReviewNote ?? "").toLowerCase().includes(noteQuery);
    const fromDate = fromFilter ? new Date(`${fromFilter}T00:00:00`) : null;
    const toDate = toFilter ? new Date(`${toFilter}T23:59:59`) : null;
    const matchesFrom = !fromDate || plannedFor.getTime() >= fromDate.getTime();
    const matchesTo = !toDate || plannedFor.getTime() <= toDate.getTime();

    const actor = getActivityActor(latestActivity?.note ?? null, latestActivity?.action ?? null);
    const matchesActor = actorFilter === "all" || actor === actorFilter;

    return matchesBroker && matchesState && matchesReview && matchesActor && matchesNote && matchesFrom && matchesTo && !isDismissed;
  });

  await Promise.all(
    matches.map(async (row) => {
      const payload = { ...((row.payloadJson ?? {}) as Record<string, unknown>) };
      payload.reminderDismissedAt = new Date().toISOString();

      await prisma.formSubmission.update({
        where: { id: row.id },
        data: { payloadJson: payload as Prisma.InputJsonValue },
      });

      await prisma.formActivity.create({
        data: {
          formSubmissionId: row.id,
          action: "status_changed",
          note: formatFormActivityNote("Admin", "Bulk dismissed reminder from content ops"),
        },
      });
    })
  );

  revalidatePath("/admin/content-ops");
  revalidatePath("/admin/dashboard");
}

async function rescheduleFilteredReminders(formData: FormData) {
  "use server";

  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/content-ops");

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/admin");

  const brokerQuery = String(formData.get("broker") ?? "").trim().toLowerCase();
  const stateFilter = String(formData.get("state") ?? "all");
  const reviewFilter = String(formData.get("review") ?? "all");
  const actorFilter = String(formData.get("actor") ?? "all");
  const noteQuery = String(formData.get("note") ?? "").trim().toLowerCase();
  const fromFilter = String(formData.get("from") ?? "");
  const toFilter = String(formData.get("to") ?? "");
  const plannedForRaw = String(formData.get("plannedFor") ?? "").trim();
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (confirmation !== "CONFIRM") return;
  if (!plannedForRaw) return;

  const nextPlannedFor = new Date(plannedForRaw);
  if (Number.isNaN(nextPlannedFor.getTime())) return;

  const rows = await prisma.formSubmission.findMany({
    where: { formType: "broker_content_pack" },
    select: {
      id: true,
      assignedTo: true,
      payloadJson: true,
      activities: {
        select: {
          action: true,
          note: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    take: 250,
  });
  const brokerDirectory = await getBrokerDirectory(rows.map((row) => row.assignedTo));

  const now = new Date();
  const matches = rows.filter((row) => {
    const payload = (row.payloadJson ?? {}) as Record<string, unknown>;
    const plannedFor = typeof payload.plannedFor === "string" ? new Date(payload.plannedFor) : null;
    const reminderHoursBefore =
      typeof payload.reminderHoursBefore === "number" ? payload.reminderHoursBefore : null;
    const reminderAt =
      plannedFor && reminderHoursBefore != null
        ? new Date(plannedFor.getTime() - reminderHoursBefore * 60 * 60 * 1000)
        : null;
    const campaignStatus = typeof payload.campaignStatus === "string" ? payload.campaignStatus : "draft";
    const reminderDismissedAt =
      typeof payload.reminderDismissedAt === "string" ? payload.reminderDismissedAt : null;
    const adminReviewedAt = typeof payload.adminReviewedAt === "string" ? payload.adminReviewedAt : null;
    const adminReviewNote = typeof payload.adminReviewNote === "string" ? payload.adminReviewNote : null;
    const broker = row.assignedTo ? brokerDirectory.get(row.assignedTo) : null;
    const brokerName = broker?.name ?? "Unknown broker";
    const brokerEmail = broker?.email ?? "No email";
    const latestActivity = row.activities[0];

    if (
      campaignStatus !== "planned" ||
      !plannedFor ||
      !reminderAt ||
      Number.isNaN(plannedFor.getTime()) ||
      Number.isNaN(reminderAt.getTime())
    ) {
      return false;
    }

    const matchesBroker =
      !brokerQuery || brokerName.toLowerCase().includes(brokerQuery) || brokerEmail.toLowerCase().includes(brokerQuery);
    const isDismissed = reminderDismissedAt != null;
    const isDue = !isDismissed && reminderAt.getTime() <= now.getTime();
    const matchesState =
      stateFilter === "all" ||
      (stateFilter === "due" && isDue) ||
      (stateFilter === "upcoming" && !isDismissed && !isDue) ||
      (stateFilter === "dismissed" && isDismissed);
    const isReviewed = adminReviewedAt != null;
    const matchesReview =
      reviewFilter === "all" ||
      (reviewFilter === "reviewed" && isReviewed) ||
      (reviewFilter === "unreviewed" && !isReviewed);
    const matchesNote = !noteQuery || (adminReviewNote ?? "").toLowerCase().includes(noteQuery);
    const fromDate = fromFilter ? new Date(`${fromFilter}T00:00:00`) : null;
    const toDate = toFilter ? new Date(`${toFilter}T23:59:59`) : null;
    const matchesFrom = !fromDate || plannedFor.getTime() >= fromDate.getTime();
    const matchesTo = !toDate || plannedFor.getTime() <= toDate.getTime();

    const actor = getActivityActor(latestActivity?.note ?? null, latestActivity?.action ?? null);
    const matchesActor = actorFilter === "all" || actor === actorFilter;

    return matchesBroker && matchesState && matchesReview && matchesActor && matchesNote && matchesFrom && matchesTo;
  });

  await Promise.all(
    matches.map(async (row) => {
      const payload = { ...((row.payloadJson ?? {}) as Record<string, unknown>) };
      payload.plannedFor = nextPlannedFor.toISOString();
      delete payload.reminderDismissedAt;

      await prisma.formSubmission.update({
        where: { id: row.id },
        data: { payloadJson: payload as Prisma.InputJsonValue },
      });

      await prisma.formActivity.create({
        data: {
          formSubmissionId: row.id,
          action: "status_changed",
          note: formatFormActivityNote("Admin", `Bulk rescheduled publish from content ops to ${nextPlannedFor.toISOString()}`),
        },
      });
    })
  );

  revalidatePath("/admin/content-ops");
  revalidatePath("/admin/dashboard");
}

export default async function AdminContentOpsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/content-ops");

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/admin");

  const role = await getUserRole();
  const resolvedSearchParams = (await searchParams) ?? {};
  const brokerQuery = typeof resolvedSearchParams.broker === "string" ? resolvedSearchParams.broker.trim().toLowerCase() : "";
  const stateFilter = typeof resolvedSearchParams.state === "string" ? resolvedSearchParams.state : "all";
  const reviewFilter = typeof resolvedSearchParams.review === "string" ? resolvedSearchParams.review : "all";
  const actorFilter = typeof resolvedSearchParams.actor === "string" ? resolvedSearchParams.actor : "all";
  const noteQuery = typeof resolvedSearchParams.note === "string" ? resolvedSearchParams.note.trim().toLowerCase() : "";
  const fromFilter = typeof resolvedSearchParams.from === "string" ? resolvedSearchParams.from : "";
  const toFilter = typeof resolvedSearchParams.to === "string" ? resolvedSearchParams.to : "";
  const sortKey = typeof resolvedSearchParams.sort === "string" ? resolvedSearchParams.sort : "reminderAt";
  const sortDir = resolvedSearchParams.dir === "asc" ? "asc" : "desc";
  const rows = await prisma.formSubmission.findMany({
    where: { formType: "broker_content_pack" },
    select: {
      id: true,
      assignedTo: true,
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
    take: 250,
  });
  const brokerDirectory = await getBrokerDirectory(rows.map((row) => row.assignedTo));

  const now = new Date();
  const reminderItems: ReminderItem[] = rows
    .map((row) => {
      const payload = (row.payloadJson ?? {}) as Record<string, unknown>;
      const plannedFor = typeof payload.plannedFor === "string" ? new Date(payload.plannedFor) : null;
      const reminderHoursBefore =
        typeof payload.reminderHoursBefore === "number" ? payload.reminderHoursBefore : null;
      const reminderAt =
        plannedFor && reminderHoursBefore != null
          ? new Date(plannedFor.getTime() - reminderHoursBefore * 60 * 60 * 1000)
          : null;
      const latestActivity = row.activities[0];
      const broker = row.assignedTo ? brokerDirectory.get(row.assignedTo) : null;

      return {
        id: row.id,
        assignedTo: row.assignedTo,
        brokerName: broker?.name ?? "Unknown broker",
        brokerEmail: broker?.email ?? "No email",
        title: typeof payload.title === "string" ? payload.title : "Saved content pack",
        folder: typeof payload.folder === "string" && payload.folder.trim() ? payload.folder : "General",
        campaignStatus: typeof payload.campaignStatus === "string" ? payload.campaignStatus : "draft",
        plannedFor,
        reminderAt,
        reminderHoursBefore,
        reminderDismissedAt:
          typeof payload.reminderDismissedAt === "string" ? payload.reminderDismissedAt : null,
        adminReviewedAt: typeof payload.adminReviewedAt === "string" ? payload.adminReviewedAt : null,
        adminReviewedBy: typeof payload.adminReviewedBy === "string" ? payload.adminReviewedBy : null,
        adminReviewNote: typeof payload.adminReviewNote === "string" ? payload.adminReviewNote : null,
        latestActivityAction: latestActivity?.action ?? null,
        latestActivityNote: latestActivity?.note ?? null,
        latestActivityAt: latestActivity?.createdAt?.toISOString() ?? null,
        activityHistory: row.activities.map((activity) => ({
          action: activity.action,
          note: activity.note ?? null,
          createdAt: activity.createdAt.toISOString(),
        })),
      };
    })
    .filter(
      (item) =>
        item.campaignStatus === "planned" &&
        item.plannedFor &&
        item.reminderAt &&
        !Number.isNaN(item.plannedFor.getTime()) &&
        !Number.isNaN(item.reminderAt.getTime())
    )
    .filter((item) => {
      const matchesBroker =
        !brokerQuery ||
        item.brokerName.toLowerCase().includes(brokerQuery) ||
        item.brokerEmail.toLowerCase().includes(brokerQuery);
      const isDismissed = item.reminderDismissedAt != null;
      const isDue = !isDismissed && (item.reminderAt?.getTime() ?? Infinity) <= now.getTime();
      const matchesState =
        stateFilter === "all" ||
        (stateFilter === "due" && isDue) ||
        (stateFilter === "upcoming" && !isDismissed && !isDue) ||
        (stateFilter === "dismissed" && isDismissed);
      const isReviewed = item.adminReviewedAt != null;
      const matchesReview =
        reviewFilter === "all" ||
        (reviewFilter === "reviewed" && isReviewed) ||
        (reviewFilter === "unreviewed" && !isReviewed);
      const matchesActor =
        actorFilter === "all" ||
        getActivityActor(item.latestActivityNote, item.latestActivityAction) === actorFilter;
      const matchesNote =
        !noteQuery || (item.adminReviewNote ?? "").toLowerCase().includes(noteQuery);
      const fromDate = fromFilter ? new Date(`${fromFilter}T00:00:00`) : null;
      const toDate = toFilter ? new Date(`${toFilter}T23:59:59`) : null;
      const matchesFrom = !fromDate || (item.plannedFor?.getTime() ?? -Infinity) >= fromDate.getTime();
      const matchesTo = !toDate || (item.plannedFor?.getTime() ?? Infinity) <= toDate.getTime();
      return matchesBroker && matchesState && matchesReview && matchesActor && matchesNote && matchesFrom && matchesTo;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const getValue = (item: ReminderItem) => {
        switch (sortKey) {
          case "broker":
            return item.brokerName.toLowerCase();
          case "title":
            return item.title.toLowerCase();
          case "folder":
            return item.folder.toLowerCase();
          case "publish":
            return item.plannedFor?.getTime() ?? 0;
          case "state":
            return item.reminderDismissedAt ? "dismissed" : (item.reminderAt?.getTime() ?? Infinity) <= now.getTime() ? "due now" : "upcoming";
          case "reminderAt":
          default:
            return item.reminderAt?.getTime() ?? 0;
        }
      };

      const left = getValue(a);
      const right = getValue(b);
      if (left < right) return -1 * dir;
      if (left > right) return 1 * dir;
      return 0;
    });

  const dueNow = reminderItems.filter((item) => item.reminderDismissedAt == null && item.reminderAt! <= now);
  const upcoming = reminderItems.filter((item) => item.reminderDismissedAt == null && item.reminderAt! > now);
  const dismissed = reminderItems.filter((item) => item.reminderDismissedAt != null);
  const reviewed = reminderItems.filter((item) => item.adminReviewedAt != null);
  const pendingReviewCount = reminderItems.filter((item) => item.adminReviewedAt == null).length;
  const activeReminderCount = reminderItems.filter((item) => item.reminderDismissedAt == null).length;
  const actorCounts = reminderItems.reduce(
    (counts, item) => {
      const actor = getActivityActor(item.latestActivityNote, item.latestActivityAction);
      if (actor) counts[actor as keyof typeof counts] += 1;
      return counts;
    },
    { Admin: 0, Broker: 0, Client: 0, System: 0 }
  );
  const brokerGroups = Array.from(
    reminderItems.reduce((map, item) => {
      const key = `${item.assignedTo ?? "unknown"}:${item.brokerEmail}`;
      const current = map.get(key) ?? {
        brokerName: item.brokerName,
        brokerEmail: item.brokerEmail,
        assignedTo: item.assignedTo,
        items: [] as ReminderItem[],
      };
      current.items.push(item);
      map.set(key, current);
      return map;
    }, new Map<string, { brokerName: string; brokerEmail: string; assignedTo: string | null; items: ReminderItem[] }>())
  )
    .map(([, group]) => {
      const due = group.items.filter(
        (item) => item.reminderDismissedAt == null && (item.reminderAt?.getTime() ?? Infinity) <= now.getTime()
      ).length;
      const pendingReview = group.items.filter((item) => item.adminReviewedAt == null).length;
      return { ...group, due, pendingReview };
    })
    .sort((a, b) => b.due - a.due || b.pendingReview - a.pendingReview || a.brokerName.localeCompare(b.brokerName));
  const csvRows = [
    [
      "Submission ID",
      "Broker",
      "Email",
      "Pack",
      "Folder",
      "Reminder At",
      "Publish At",
      "State",
      "Reviewed At",
      "Review Note",
      "Latest Activity At",
      "Latest Activity Action",
      "Latest Activity Actor",
      "Latest Activity Note",
    ],
    ...reminderItems.map((item) => {
      const isDue = item.reminderDismissedAt == null && (item.reminderAt?.getTime() ?? Infinity) <= now.getTime();
      return [
        item.id,
        item.brokerName,
        item.brokerEmail,
        item.title,
        item.folder,
        item.reminderAt ? item.reminderAt.toISOString() : "",
        item.plannedFor ? item.plannedFor.toISOString() : "",
        item.reminderDismissedAt ? "dismissed" : isDue ? "due now" : "upcoming",
        item.adminReviewedAt ?? "",
        item.adminReviewNote ?? "",
        item.latestActivityAt ?? "",
        item.latestActivityAction ?? "",
        getActivityActor(item.latestActivityNote, item.latestActivityAction) ?? "",
        item.latestActivityNote ?? "",
      ];
    }),
  ];
  const csvContent = csvRows
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
  const legalPacket = {
    exportedAt: new Date().toISOString(),
    filters: {
      broker: brokerQuery || null,
      state: stateFilter,
      review: reviewFilter,
      actor: actorFilter,
      note: noteQuery || null,
      from: fromFilter || null,
      to: toFilter || null,
      sort: sortKey,
      dir: sortDir,
    },
    totals: {
      visibleItems: reminderItems.length,
      activeReminders: activeReminderCount,
      reviewed: reviewed.length,
      pendingReview: pendingReviewCount,
      dismissed: dismissed.length,
    },
    items: reminderItems.map((item) => {
      const isDue = item.reminderDismissedAt == null && (item.reminderAt?.getTime() ?? Infinity) <= now.getTime();
      return {
        id: item.id,
        assignedTo: item.assignedTo,
        broker: {
          name: item.brokerName,
          email: item.brokerEmail,
        },
        pack: {
          title: item.title,
          folder: item.folder,
          campaignStatus: item.campaignStatus,
        },
        schedule: {
          plannedFor: item.plannedFor ? item.plannedFor.toISOString() : null,
          reminderAt: item.reminderAt ? item.reminderAt.toISOString() : null,
          reminderHoursBefore: item.reminderHoursBefore,
        },
        review: {
          adminReviewedAt: item.adminReviewedAt,
          adminReviewedBy: item.adminReviewedBy,
          adminReviewNote: item.adminReviewNote,
        },
        reminderState: {
          dismissedAt: item.reminderDismissedAt,
          status: item.reminderDismissedAt ? "dismissed" : isDue ? "due now" : "upcoming",
        },
        latestActivity: {
          at: item.latestActivityAt,
          action: item.latestActivityAction,
          actor: getActivityActor(item.latestActivityNote, item.latestActivityAction),
          note: item.latestActivityNote,
        },
        activityHistory: item.activityHistory.map((activity) => ({
          ...activity,
          actor: getActivityActor(activity.note, activity.action),
        })),
      };
    }),
  };
  const jsonHref = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(legalPacket, null, 2))}`;
  const evidenceText = [
    "BNHUB CONTENT OPS LEGAL EVIDENCE",
    `Exported At: ${legalPacket.exportedAt}`,
    `Visible Items: ${reminderItems.length}`,
    `Filters: broker=${brokerQuery || "all"} | state=${stateFilter} | review=${reviewFilter} | actor=${actorFilter} | note=${noteQuery || "all"} | from=${fromFilter || "all"} | to=${toFilter || "all"} | sort=${sortKey} | dir=${sortDir}`,
    "",
    ...reminderItems.flatMap((item, index) => {
      const isDue = item.reminderDismissedAt == null && (item.reminderAt?.getTime() ?? Infinity) <= now.getTime();
      const state = item.reminderDismissedAt ? "dismissed" : isDue ? "due now" : "upcoming";
      return [
        `#${index + 1} ${item.title}`,
        `Submission ID: ${item.id}`,
        `Broker: ${item.brokerName} <${item.brokerEmail}>`,
        `Folder: ${item.folder}`,
        `Publish At: ${item.plannedFor ? item.plannedFor.toISOString() : "n/a"}`,
        `Reminder At: ${item.reminderAt ? item.reminderAt.toISOString() : "n/a"}`,
        `Reminder State: ${state}`,
        `Reviewed At: ${item.adminReviewedAt ?? "n/a"}`,
        `Review Note: ${item.adminReviewNote ?? "n/a"}`,
        `Latest Activity: ${item.latestActivityAt ?? "n/a"} | ${item.latestActivityAction ?? "n/a"} | ${getActivityActor(item.latestActivityNote, item.latestActivityAction) ?? "Unknown"} | ${item.latestActivityNote ?? "n/a"}`,
        "Activity History:",
        ...(item.activityHistory.length
          ? item.activityHistory.map(
              (activity) =>
                `- ${activity.createdAt} | ${activity.action} | ${getActivityActor(activity.note, activity.action) ?? "Unknown"} | ${activity.note ?? "n/a"}`
            )
          : ["- none"]),
        "",
      ];
    }),
  ].join("\n");
  const evidenceHref = `data:text/plain;charset=utf-8,${encodeURIComponent(evidenceText)}`;
  const actorFilterHrefs = {
    all: `/admin/content-ops?${new URLSearchParams({
      ...(brokerQuery ? { broker: brokerQuery } : {}),
      ...(stateFilter !== "all" ? { state: stateFilter } : {}),
      ...(reviewFilter !== "all" ? { review: reviewFilter } : {}),
      ...(noteQuery ? { note: noteQuery } : {}),
      ...(fromFilter ? { from: fromFilter } : {}),
      ...(toFilter ? { to: toFilter } : {}),
      ...(sortKey !== "reminderAt" ? { sort: sortKey } : {}),
      ...(sortDir !== "desc" ? { dir: sortDir } : {}),
    }).toString()}`,
    Admin: `/admin/content-ops?${new URLSearchParams({
      ...(brokerQuery ? { broker: brokerQuery } : {}),
      ...(stateFilter !== "all" ? { state: stateFilter } : {}),
      ...(reviewFilter !== "all" ? { review: reviewFilter } : {}),
      actor: "Admin",
      ...(noteQuery ? { note: noteQuery } : {}),
      ...(fromFilter ? { from: fromFilter } : {}),
      ...(toFilter ? { to: toFilter } : {}),
      ...(sortKey !== "reminderAt" ? { sort: sortKey } : {}),
      ...(sortDir !== "desc" ? { dir: sortDir } : {}),
    }).toString()}`,
    Broker: `/admin/content-ops?${new URLSearchParams({
      ...(brokerQuery ? { broker: brokerQuery } : {}),
      ...(stateFilter !== "all" ? { state: stateFilter } : {}),
      ...(reviewFilter !== "all" ? { review: reviewFilter } : {}),
      actor: "Broker",
      ...(noteQuery ? { note: noteQuery } : {}),
      ...(fromFilter ? { from: fromFilter } : {}),
      ...(toFilter ? { to: toFilter } : {}),
      ...(sortKey !== "reminderAt" ? { sort: sortKey } : {}),
      ...(sortDir !== "desc" ? { dir: sortDir } : {}),
    }).toString()}`,
    Client: `/admin/content-ops?${new URLSearchParams({
      ...(brokerQuery ? { broker: brokerQuery } : {}),
      ...(stateFilter !== "all" ? { state: stateFilter } : {}),
      ...(reviewFilter !== "all" ? { review: reviewFilter } : {}),
      actor: "Client",
      ...(noteQuery ? { note: noteQuery } : {}),
      ...(fromFilter ? { from: fromFilter } : {}),
      ...(toFilter ? { to: toFilter } : {}),
      ...(sortKey !== "reminderAt" ? { sort: sortKey } : {}),
      ...(sortDir !== "desc" ? { dir: sortDir } : {}),
    }).toString()}`,
    System: `/admin/content-ops?${new URLSearchParams({
      ...(brokerQuery ? { broker: brokerQuery } : {}),
      ...(stateFilter !== "all" ? { state: stateFilter } : {}),
      ...(reviewFilter !== "all" ? { review: reviewFilter } : {}),
      actor: "System",
      ...(noteQuery ? { note: noteQuery } : {}),
      ...(fromFilter ? { from: fromFilter } : {}),
      ...(toFilter ? { to: toFilter } : {}),
      ...(sortKey !== "reminderAt" ? { sort: sortKey } : {}),
      ...(sortDir !== "desc" ? { dir: sortDir } : {}),
    }).toString()}`,
  } as const;
  const quickScopeHrefs = {
    due: `/admin/content-ops?${new URLSearchParams({
      ...(brokerQuery ? { broker: brokerQuery } : {}),
      state: "due",
      ...(reviewFilter !== "all" ? { review: reviewFilter } : {}),
      ...(actorFilter !== "all" ? { actor: actorFilter } : {}),
      ...(noteQuery ? { note: noteQuery } : {}),
      ...(fromFilter ? { from: fromFilter } : {}),
      ...(toFilter ? { to: toFilter } : {}),
      ...(sortKey !== "reminderAt" ? { sort: sortKey } : {}),
      ...(sortDir !== "desc" ? { dir: sortDir } : {}),
    }).toString()}`,
    upcoming: `/admin/content-ops?${new URLSearchParams({
      ...(brokerQuery ? { broker: brokerQuery } : {}),
      state: "upcoming",
      ...(reviewFilter !== "all" ? { review: reviewFilter } : {}),
      ...(actorFilter !== "all" ? { actor: actorFilter } : {}),
      ...(noteQuery ? { note: noteQuery } : {}),
      ...(fromFilter ? { from: fromFilter } : {}),
      ...(toFilter ? { to: toFilter } : {}),
      ...(sortKey !== "reminderAt" ? { sort: sortKey } : {}),
      ...(sortDir !== "desc" ? { dir: sortDir } : {}),
    }).toString()}`,
    dismissed: `/admin/content-ops?${new URLSearchParams({
      ...(brokerQuery ? { broker: brokerQuery } : {}),
      state: "dismissed",
      ...(reviewFilter !== "all" ? { review: reviewFilter } : {}),
      ...(actorFilter !== "all" ? { actor: actorFilter } : {}),
      ...(noteQuery ? { note: noteQuery } : {}),
      ...(fromFilter ? { from: fromFilter } : {}),
      ...(toFilter ? { to: toFilter } : {}),
      ...(sortKey !== "reminderAt" ? { sort: sortKey } : {}),
      ...(sortDir !== "desc" ? { dir: sortDir } : {}),
    }).toString()}`,
    reviewed: `/admin/content-ops?${new URLSearchParams({
      ...(brokerQuery ? { broker: brokerQuery } : {}),
      ...(stateFilter !== "all" ? { state: stateFilter } : {}),
      review: "reviewed",
      ...(actorFilter !== "all" ? { actor: actorFilter } : {}),
      ...(noteQuery ? { note: noteQuery } : {}),
      ...(fromFilter ? { from: fromFilter } : {}),
      ...(toFilter ? { to: toFilter } : {}),
      ...(sortKey !== "reminderAt" ? { sort: sortKey } : {}),
      ...(sortDir !== "desc" ? { dir: sortDir } : {}),
    }).toString()}`,
  } as const;

  return (
    <HubLayout
      title="Content ops"
      hubKey="admin"
      navigation={hubNavigation.admin}
      showAdminInSwitcher={isHubAdminRole(role)}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold">
              Broker Content Oversight
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Admin content operations</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Review scheduled broker campaign reminders across the platform, spot overdue reminder windows, and jump
              into the broker content workflow when intervention is needed.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/dashboard"
              className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/85 hover:border-premium-gold/40 hover:text-white"
            >
              AdminHub
            </Link>
            <Link
              href="/dashboard/broker/content-studio"
              className="rounded-xl border border-premium-gold/40 bg-premium-gold/10 px-4 py-2 text-sm font-semibold text-premium-gold hover:bg-premium-gold/20"
            >
              Open broker content studio
            </Link>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard href={quickScopeHrefs.due} label="Due now" value={String(dueNow.length)} sublabel="Reminder windows already open" tone="red" />
          <StatCard href={quickScopeHrefs.upcoming} label="Upcoming" value={String(upcoming.length)} sublabel="Reminder windows still ahead" tone="green" />
          <StatCard href={quickScopeHrefs.dismissed} label="Dismissed" value={String(dismissed.length)} sublabel="Reminders manually silenced" tone="slate" />
          <StatCard
            label="Active brokers"
            value={String(new Set(reminderItems.map((item) => item.assignedTo).filter(Boolean)).size)}
            sublabel="Distinct brokers with reminder items"
            tone="gold"
          />
          <StatCard href={quickScopeHrefs.reviewed} label="Reviewed" value={String(reviewed.length)} sublabel="Items checked by admin" tone="green" />
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-5">
          <form className="grid gap-3 lg:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr_auto]">
            <input
              type="text"
              name="broker"
              defaultValue={brokerQuery}
              placeholder="Filter by broker name or e-mail"
              className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-premium-gold/40"
            />
            <select
              name="state"
              defaultValue={stateFilter}
              className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-premium-gold/40"
            >
              <option value="all">All states</option>
              <option value="due">Due now</option>
              <option value="upcoming">Upcoming</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <select
              name="review"
              defaultValue={reviewFilter}
              className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-premium-gold/40"
            >
              <option value="all">All review states</option>
              <option value="reviewed">Reviewed only</option>
              <option value="unreviewed">Unreviewed only</option>
            </select>
            <select
              name="actor"
              defaultValue={actorFilter}
              className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-premium-gold/40"
            >
              <option value="all">All actors</option>
              <option value="Admin">Admin</option>
              <option value="Broker">Broker</option>
              <option value="Client">Client</option>
              <option value="System">System</option>
            </select>
            <input
              type="text"
              name="note"
              defaultValue={noteQuery}
              placeholder="Search review notes"
              className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-premium-gold/40"
            />
            <input
              type="date"
              name="from"
              defaultValue={fromFilter}
              className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-premium-gold/40"
            />
            <input
              type="date"
              name="to"
              defaultValue={toFilter}
              className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-premium-gold/40"
            />
            <select
              name="sort"
              defaultValue={sortKey}
              className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-premium-gold/40"
            >
              <option value="reminderAt">Sort by reminder</option>
              <option value="publish">Sort by publish</option>
              <option value="broker">Sort by broker</option>
              <option value="title">Sort by pack</option>
              <option value="folder">Sort by folder</option>
              <option value="state">Sort by state</option>
            </select>
            <select
              name="dir"
              defaultValue={sortDir}
              className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-premium-gold/40"
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-xl border border-premium-gold/40 bg-premium-gold/10 px-4 py-3 text-sm font-semibold text-premium-gold hover:bg-premium-gold/20"
              >
                Apply
              </button>
              <Link
                href="/admin/content-ops"
                className="rounded-xl border border-white/15 px-4 py-3 text-sm text-white/85 hover:border-premium-gold/40 hover:text-white"
              >
                Reset
              </Link>
              <a
                href={csvHref}
                download="admin-content-ops.csv"
                className="rounded-xl border border-emerald-400/30 px-4 py-3 text-sm text-emerald-100 hover:bg-emerald-500/10"
              >
                Export CSV
              </a>
              <a
                href={jsonHref}
                download="admin-content-ops-legal-packet.json"
                className="rounded-xl border border-sky-400/30 px-4 py-3 text-sm text-sky-100 hover:bg-sky-500/10"
              >
                Export legal packet
              </a>
              <a
                href={evidenceHref}
                download="admin-content-ops-evidence.txt"
                className="rounded-xl border border-fuchsia-400/30 px-4 py-3 text-sm text-fuchsia-100 hover:bg-fuchsia-500/10"
              >
                Export evidence
              </a>
            </div>
          </form>
          <div className="mt-4 grid gap-3 xl:grid-cols-3">
            <div className="rounded-xl border border-premium-gold/20 bg-premium-gold/5 p-4 xl:col-span-3">
              <p className="text-sm font-medium text-white">Current action scope</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Filtered items</p>
                  <p className="mt-1 text-xl font-semibold text-white">{reminderItems.length}</p>
                </div>
                <div className="rounded-lg border border-amber-400/20 bg-amber-500/5 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">Active reminders</p>
                  <p className="mt-1 text-xl font-semibold text-white">{activeReminderCount}</p>
                </div>
                <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/5 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">Reviewed</p>
                  <p className="mt-1 text-xl font-semibold text-white">{reviewed.length}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Pending review</p>
                  <p className="mt-1 text-xl font-semibold text-white">{pendingReviewCount}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Bulk actions below will apply only to this currently filtered queue.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={actorFilterHrefs.all}
                  className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                    actorFilter === "all"
                      ? "border-premium-gold/40 bg-premium-gold/10 text-premium-gold"
                      : "border-white/10 bg-black/20 text-slate-300 hover:border-premium-gold/30 hover:text-white"
                  }`}
                >
                  All actors
                </Link>
                {(["Admin", "Broker", "Client", "System"] as const).map((actor) => (
                  <Link
                    key={actor}
                    href={actorFilterHrefs[actor]}
                    className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                      actorFilter === actor
                        ? "border-premium-gold/40 bg-premium-gold/10 text-premium-gold"
                        : "border-white/10 bg-black/20 text-slate-300 hover:border-premium-gold/30 hover:text-white"
                    }`}
                  >
                    {actor}: {actorCounts[actor]}
                  </Link>
                ))}
              </div>
            </div>
            <form action={bulkReviewFilteredItems} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <input type="hidden" name="broker" value={brokerQuery} />
              <input type="hidden" name="state" value={stateFilter} />
              <input type="hidden" name="review" value={reviewFilter} />
              <input type="hidden" name="actor" value={actorFilter} />
              <input type="hidden" name="note" value={noteQuery} />
              <input type="hidden" name="from" value={fromFilter} />
              <input type="hidden" name="to" value={toFilter} />
              <p className="text-sm font-medium text-white">Bulk review filtered queue</p>
              <p className="mt-1 text-xs text-slate-400">Mark all currently filtered items reviewed with one note.</p>
              <input
                type="text"
                name="reviewNote"
                placeholder="bulk review note"
                className="mt-3 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-premium-gold/40"
              />
              <button
                type="submit"
                className="mt-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/20"
              >
                Mark filtered items reviewed
              </button>
            </form>
            <form action={dismissFilteredReminders} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <input type="hidden" name="broker" value={brokerQuery} />
              <input type="hidden" name="state" value={stateFilter} />
              <input type="hidden" name="review" value={reviewFilter} />
              <input type="hidden" name="actor" value={actorFilter} />
              <input type="hidden" name="note" value={noteQuery} />
              <input type="hidden" name="from" value={fromFilter} />
              <input type="hidden" name="to" value={toFilter} />
              <p className="text-sm font-medium text-white">Dismiss filtered reminders</p>
              <p className="mt-1 text-xs text-slate-400">Silence all active reminder windows in the current filtered queue.</p>
              <input
                type="text"
                name="confirmation"
                placeholder="Type CONFIRM"
                className="mt-3 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-premium-gold/40"
              />
              <button
                type="submit"
                className="mt-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-100 hover:bg-amber-500/20"
              >
                Dismiss filtered reminders
              </button>
            </form>
            <form action={rescheduleFilteredReminders} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <input type="hidden" name="broker" value={brokerQuery} />
              <input type="hidden" name="state" value={stateFilter} />
              <input type="hidden" name="review" value={reviewFilter} />
              <input type="hidden" name="actor" value={actorFilter} />
              <input type="hidden" name="note" value={noteQuery} />
              <input type="hidden" name="from" value={fromFilter} />
              <input type="hidden" name="to" value={toFilter} />
              <p className="text-sm font-medium text-white">Reschedule filtered reminders</p>
              <p className="mt-1 text-xs text-slate-400">Set one new publish datetime for every currently filtered item.</p>
              <input
                type="datetime-local"
                name="plannedFor"
                className="mt-3 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-premium-gold/40"
              />
              <input
                type="text"
                name="confirmation"
                placeholder="Type CONFIRM"
                className="mt-3 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-premium-gold/40"
              />
              <button
                type="submit"
                className="mt-3 rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-100 hover:bg-sky-500/20"
              >
                Reschedule filtered reminders
              </button>
            </form>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <QueueCard
            title="Due now"
            subtitle="Immediate broker reminder actions"
            items={dueNow}
            empty="No due-now campaign reminders."
          />
          <QueueCard
            title="Upcoming"
            subtitle="Next reminder windows to watch"
            items={upcoming.slice(0, 20)}
            empty="No upcoming reminder windows."
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Broker workload groups</h2>
            <span className="text-xs text-slate-500">Grouped from the current filtered queue</span>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {brokerGroups.length === 0 ? (
              <p className="text-sm text-slate-500">No broker groups match the current filters.</p>
            ) : (
              brokerGroups.map((group) => (
                <div key={`${group.assignedTo ?? "unknown"}-${group.brokerEmail}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{group.brokerName}</p>
                      <p className="mt-1 text-xs text-slate-500">{group.brokerEmail}</p>
                    </div>
                    <Link
                      href={`/admin/users?search=${encodeURIComponent(group.brokerEmail)}`}
                      className="text-xs font-medium text-premium-gold hover:underline"
                    >
                      Open user →
                    </Link>
                    {group.assignedTo ? (
                      <Link
                        href={`/admin/content-ops/brokers/${encodeURIComponent(group.assignedTo)}`}
                        className="text-xs font-medium text-white/80 hover:text-white hover:underline"
                      >
                        Broker drilldown →
                      </Link>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-red-400/20 bg-red-500/5 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-red-200">Due now</p>
                      <p className="mt-1 text-xl font-semibold text-white">{group.due}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Pending review</p>
                      <p className="mt-1 text-xl font-semibold text-white">{group.pendingReview}</p>
                    </div>
                    <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/5 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">Total items</p>
                      <p className="mt-1 text-xl font-semibold text-white">{group.items.length}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {group.items.slice(0, 4).map((item) => {
                      const isDue = item.reminderDismissedAt == null && (item.reminderAt?.getTime() ?? Infinity) <= now.getTime();
                      return (
                        <div key={item.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm text-white">{item.title}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {item.folder} · {item.plannedFor ? item.plannedFor.toISOString().slice(0, 16).replace("T", " ") : "No publish time"}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                                item.reminderDismissedAt
                                  ? "bg-slate-500/15 text-slate-300"
                                  : isDue
                                    ? "bg-rose-500/15 text-rose-200"
                                    : "bg-emerald-500/15 text-emerald-200"
                              }`}
                            >
                              {item.reminderDismissedAt ? "dismissed" : isDue ? "due now" : "upcoming"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">All reminder items</h2>
            <span className="text-xs text-slate-500">Newest scheduled content reminders</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Broker</th>
                  <th className="pb-3 pr-4 font-medium">Pack</th>
                  <th className="pb-3 pr-4 font-medium">Folder</th>
                  <th className="pb-3 pr-4 font-medium">Reminder</th>
                  <th className="pb-3 pr-4 font-medium">Publish</th>
                  <th className="pb-3 pr-4 font-medium">State</th>
                  <th className="pb-3 pr-4 font-medium">Review</th>
                  <th className="pb-3 pr-0 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reminderItems.map((item) => {
                  const isDue = item.reminderDismissedAt == null && (item.reminderAt?.getTime() ?? Infinity) <= now.getTime();
                  return (
                    <tr key={item.id} className="border-t border-white/10 align-top">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-white">{item.brokerName}</div>
                        <div className="text-xs text-slate-500">{item.brokerEmail}</div>
                      </td>
                      <td className="py-3 pr-4 text-slate-200">{item.title}</td>
                      <td className="py-3 pr-4 text-slate-400">{item.folder}</td>
                      <td className="py-3 pr-4 text-slate-400">
                        {item.reminderAt ? item.reminderAt.toISOString().slice(0, 16).replace("T", " ") : "—"}
                      </td>
                      <td className="py-3 pr-4 text-slate-400">
                        {item.plannedFor ? item.plannedFor.toISOString().slice(0, 16).replace("T", " ") : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                            item.reminderDismissedAt
                              ? "bg-slate-500/15 text-slate-300"
                              : isDue
                                ? "bg-rose-500/15 text-rose-200"
                                : "bg-emerald-500/15 text-emerald-200"
                          }`}
                        >
                          {item.reminderDismissedAt ? "dismissed" : isDue ? "due now" : "upcoming"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {item.adminReviewedAt ? (
                          <div className="space-y-2">
                            <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                              reviewed
                            </span>
                            <div className="text-xs text-slate-500">
                              {new Date(item.adminReviewedAt).toISOString().slice(0, 16).replace("T", " ")}
                            </div>
                            {item.adminReviewNote ? (
                              <div className="max-w-xs text-xs text-slate-400">{item.adminReviewNote}</div>
                            ) : null}
                          </div>
                        ) : (
                          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
                            pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-0">
                        <div className="flex flex-wrap gap-3">
                          <Link
                            href="/dashboard/broker/content-studio"
                            className="text-xs font-medium text-premium-gold hover:underline"
                          >
                            Open studio →
                          </Link>
                          <a
                            href={`mailto:${item.brokerEmail}?subject=${encodeURIComponent(`Content reminder: ${item.title}`)}`}
                            className="text-xs font-medium text-white/80 hover:text-white hover:underline"
                          >
                            E-mail broker
                          </a>
                          <Link
                            href={`/admin/users?search=${encodeURIComponent(item.brokerEmail)}`}
                            className="text-xs font-medium text-white/80 hover:text-white hover:underline"
                          >
                            Open user record
                          </Link>
                          <LegalPacketLink
                            href={`/admin/content-ops/items/${encodeURIComponent(item.id)}`}
                            className="text-xs font-medium text-sky-200 hover:text-sky-100 hover:underline"
                          />
                          <form action={updateReviewState} className="flex flex-wrap items-center gap-2">
                            <input type="hidden" name="submissionId" value={item.id} />
                            <input type="hidden" name="mode" value={item.adminReviewedAt ? "clear" : "review"} />
                            <input
                              type="text"
                              name="reviewNote"
                              defaultValue={item.adminReviewNote ?? ""}
                              placeholder="review note"
                              className="rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-xs text-white outline-none transition focus:border-premium-gold/40"
                            />
                            <button
                              type="submit"
                              className="text-xs font-medium text-emerald-200 hover:text-emerald-100 hover:underline"
                            >
                              {item.adminReviewedAt ? "Clear review" : "Mark reviewed"}
                            </button>
                          </form>
                        </div>
                        {item.latestActivityAt ? (
                          <div className="mt-2 max-w-sm text-xs text-slate-500">
                            {(() => {
                              const latest = parseActivityNote(item.latestActivityNote, item.latestActivityAction);
                              return (
                                <div className="flex flex-wrap items-center gap-2">
                                  <span>Last activity: {new Date(item.latestActivityAt).toISOString().slice(0, 16).replace("T", " ")}</span>
                                  {latest.actor ? <ActivityBadge actor={latest.actor} /> : null}
                                  <span>{latest.detail}</span>
                                </div>
                              );
                            })()}
                          </div>
                        ) : null}
                        {item.activityHistory.length > 1 ? (
                          <details className="mt-2 max-w-md text-xs text-slate-400">
                            <summary className="cursor-pointer text-slate-500 hover:text-slate-300">
                              View recent activity history
                            </summary>
                            <div className="mt-2 space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
                              {item.activityHistory.map((activity, index) => (
                                <div key={`${item.id}-${activity.createdAt}-${index}`} className="border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
                                  <div className="flex flex-wrap items-center gap-2 text-slate-300">
                                    <span>{new Date(activity.createdAt).toISOString().slice(0, 16).replace("T", " ")}</span>
                                    {parseActivityNote(activity.note, activity.action).actor ? (
                                      <ActivityBadge actor={parseActivityNote(activity.note, activity.action).actor!} />
                                    ) : null}
                                    <span>{parseActivityNote(activity.note, activity.action).detail}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </details>
                        ) : null}
                        <form action={addAdminActivityNote} className="mt-3 flex max-w-md flex-wrap items-end gap-2">
                          <input type="hidden" name="submissionId" value={item.id} />
                          <textarea
                            name="adminNote"
                            placeholder="Add admin legal note"
                            rows={2}
                            className="min-h-[56px] min-w-[240px] flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-xs text-white outline-none transition focus:border-premium-gold/40"
                          />
                          <button
                            type="submit"
                            className="rounded-lg border border-premium-gold/40 bg-premium-gold/10 px-3 py-2 text-xs font-medium text-premium-gold hover:bg-premium-gold/20"
                          >
                            Save note
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </HubLayout>
  );
}

function StatCard({
  href,
  label,
  value,
  sublabel,
  tone,
}: {
  href?: string;
  label: string;
  value: string;
  sublabel: string;
  tone: "red" | "green" | "slate" | "gold";
}) {
  const toneClass =
    tone === "red"
      ? "border-red-400/20 bg-red-500/5 text-red-200"
      : tone === "green"
        ? "border-emerald-400/20 bg-emerald-500/5 text-emerald-200"
        : tone === "gold"
          ? "border-premium-gold/20 bg-premium-gold/5 text-premium-gold"
          : "border-white/10 bg-white/[0.03] text-slate-300";

  const content = (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{sublabel}</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}

function parseActivityNote(note: string | null, fallbackAction: string | null) {
  if (!note) {
    return { actor: null, detail: fallbackAction ?? "Activity recorded" };
  }

  const match = note.match(/^\[(Admin|Broker|Client|System)\]\s*(.+)$/);
  if (!match) {
    return { actor: null, detail: note };
  }

  return { actor: match[1], detail: match[2] || fallbackAction || "Activity recorded" };
}

function getActivityActor(note: string | null, fallbackAction: string | null) {
  return parseActivityNote(note, fallbackAction).actor;
}

function ActivityBadge({ actor }: { actor: string }) {
  const className =
    actor === "Admin"
      ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
      : actor === "Broker"
        ? "border-premium-gold/30 bg-premium-gold/10 text-premium-gold"
        : actor === "Client"
          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
          : "border-sky-400/30 bg-sky-500/10 text-sky-200";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${className}`}>
      {actor}
    </span>
  );
}

function QueueCard({
  title,
  subtitle,
  items,
  empty,
}: {
  title: string;
  subtitle: string;
  items: ReminderItem[];
  empty: string;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">{empty}</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.brokerName} · {item.brokerEmail}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Reminder {item.reminderAt ? item.reminderAt.toISOString().slice(0, 16).replace("T", " ") : "—"}
                    {" · "}
                    Publish {item.plannedFor ? item.plannedFor.toISOString().slice(0, 16).replace("T", " ") : "—"}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Review: {item.adminReviewedAt ? new Date(item.adminReviewedAt).toISOString().slice(0, 16).replace("T", " ") : "Pending"}
                  </p>
                  {item.adminReviewNote ? (
                    <p className="mt-2 text-xs text-slate-400">Note: {item.adminReviewNote}</p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Link href="/dashboard/broker/content-studio" className="text-xs font-medium text-premium-gold hover:underline">
                    Open studio →
                  </Link>
                  <form action={updateReviewState} className="flex flex-col items-end gap-2">
                    <input type="hidden" name="submissionId" value={item.id} />
                    <input type="hidden" name="mode" value={item.adminReviewedAt ? "clear" : "review"} />
                    <input
                      type="text"
                      name="reviewNote"
                      defaultValue={item.adminReviewNote ?? ""}
                      placeholder="review note"
                      className="w-44 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-xs text-white outline-none transition focus:border-premium-gold/40"
                    />
                    <button type="submit" className="text-xs font-medium text-emerald-200 hover:text-emerald-100 hover:underline">
                      {item.adminReviewedAt ? "Clear review" : "Mark reviewed"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
