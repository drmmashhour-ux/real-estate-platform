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
  brokerName: string;
  brokerEmail: string;
  title: string;
  folder: string;
  plannedFor: Date | null;
  reminderAt: Date | null;
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

async function markBrokerItemsReviewed(formData: FormData) {
  "use server";

  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/content-ops");

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/admin");

  const brokerId = String(formData.get("brokerId") ?? "");
  const reviewNote = String(formData.get("reviewNote") ?? "").trim();
  const state = String(formData.get("state") ?? "all");
  const review = String(formData.get("review") ?? "all");
  const actor = String(formData.get("actor") ?? "all");

  if (!brokerId) return;

  const rows = await prisma.formSubmission.findMany({
    where: {
      formType: "broker_content_pack",
      assignedTo: brokerId,
    },
    select: {
      id: true,
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
    const reminderDismissedAt =
      typeof payload.reminderDismissedAt === "string" ? payload.reminderDismissedAt : null;
    const adminReviewedAt = typeof payload.adminReviewedAt === "string" ? payload.adminReviewedAt : null;
    const latestActivity = row.activities[0];

    if (!plannedFor || !reminderAt || Number.isNaN(plannedFor.getTime()) || Number.isNaN(reminderAt.getTime())) {
      return false;
    }

    const isDue = reminderDismissedAt == null && reminderAt.getTime() <= now.getTime();
    const isUpcoming = reminderDismissedAt == null && reminderAt.getTime() > now.getTime();

    if (state === "due" && !isDue) return false;
    if (state === "upcoming" && !isUpcoming) return false;
    if (state === "dismissed" && reminderDismissedAt == null) return false;
    if (review === "reviewed" && adminReviewedAt == null) return false;
    if (review === "unreviewed" && adminReviewedAt != null) return false;
    if (actor !== "all" && getActivityActor(latestActivity?.note ?? null, latestActivity?.action ?? null) !== actor) return false;

    return true;
  });

  await Promise.all(
    matches.map(async (row) => {
      const payload = { ...((row.payloadJson ?? {}) as Record<string, unknown>) };
      payload.adminReviewedAt = new Date().toISOString();
      payload.adminReviewedBy = userId;
      payload.adminReviewNote = reviewNote || "Bulk reviewed from broker drilldown";

      await prisma.formSubmission.update({
        where: { id: row.id },
        data: { payloadJson: payload as Prisma.InputJsonValue },
      });

      await prisma.formActivity.create({
        data: {
          formSubmissionId: row.id,
          action: "updated",
          note: formatFormActivityNote("Admin", `Bulk reviewed from broker drilldown${reviewNote ? `: ${reviewNote}` : ""}`),
        },
      });
    })
  );

  revalidatePath("/admin/content-ops");
  revalidatePath(`/admin/content-ops/brokers/${brokerId}`);
  revalidatePath("/admin/dashboard");
}

async function addBrokerAdminActivityNote(formData: FormData) {
  "use server";

  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/content-ops");

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/admin");

  const brokerId = String(formData.get("brokerId") ?? "");
  const submissionId = String(formData.get("submissionId") ?? "");
  const note = String(formData.get("adminNote") ?? "").trim();
  if (!brokerId || !submissionId || !note) return;

  const existing = await prisma.formSubmission.findFirst({
    where: {
      id: submissionId,
      formType: "broker_content_pack",
      assignedTo: brokerId,
    },
    select: { id: true },
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
  revalidatePath(`/admin/content-ops/brokers/${brokerId}`);
  revalidatePath("/admin/dashboard");
}

async function clearBrokerItemReviews(formData: FormData) {
  "use server";

  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/content-ops");

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/admin");

  const brokerId = String(formData.get("brokerId") ?? "");
  const state = String(formData.get("state") ?? "all");
  const review = String(formData.get("review") ?? "all");
  const actor = String(formData.get("actor") ?? "all");

  if (!brokerId) return;

  const rows = await prisma.formSubmission.findMany({
    where: {
      formType: "broker_content_pack",
      assignedTo: brokerId,
    },
    select: {
      id: true,
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
    const reminderDismissedAt =
      typeof payload.reminderDismissedAt === "string" ? payload.reminderDismissedAt : null;
    const adminReviewedAt = typeof payload.adminReviewedAt === "string" ? payload.adminReviewedAt : null;
    const latestActivity = row.activities[0];

    if (!plannedFor || !reminderAt || Number.isNaN(plannedFor.getTime()) || Number.isNaN(reminderAt.getTime())) {
      return false;
    }

    const isDue = reminderDismissedAt == null && reminderAt.getTime() <= now.getTime();
    const isUpcoming = reminderDismissedAt == null && reminderAt.getTime() > now.getTime();

    if (state === "due" && !isDue) return false;
    if (state === "upcoming" && !isUpcoming) return false;
    if (state === "dismissed" && reminderDismissedAt == null) return false;
    if (review === "reviewed" && adminReviewedAt == null) return false;
    if (review === "unreviewed" && adminReviewedAt != null) return false;
    if (actor !== "all" && getActivityActor(latestActivity?.note ?? null, latestActivity?.action ?? null) !== actor) return false;

    return adminReviewedAt != null;
  });

  await Promise.all(
    matches.map(async (row) => {
      const payload = { ...((row.payloadJson ?? {}) as Record<string, unknown>) };
      delete payload.adminReviewedAt;
      delete payload.adminReviewedBy;
      delete payload.adminReviewNote;

      await prisma.formSubmission.update({
        where: { id: row.id },
        data: { payloadJson: payload as Prisma.InputJsonValue },
      });

      await prisma.formActivity.create({
        data: {
          formSubmissionId: row.id,
          action: "updated",
          note: formatFormActivityNote("Admin", "Bulk cleared review from broker drilldown"),
        },
      });
    })
  );

  revalidatePath("/admin/content-ops");
  revalidatePath(`/admin/content-ops/brokers/${brokerId}`);
  revalidatePath("/admin/dashboard");
}

async function dismissBrokerReminders(formData: FormData) {
  "use server";

  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/content-ops");

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/admin");

  const brokerId = String(formData.get("brokerId") ?? "");
  const state = String(formData.get("state") ?? "all");
  const review = String(formData.get("review") ?? "all");
  const actor = String(formData.get("actor") ?? "all");
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (confirmation !== "CONFIRM") return;

  if (!brokerId) return;

  const rows = await prisma.formSubmission.findMany({
    where: {
      formType: "broker_content_pack",
      assignedTo: brokerId,
    },
    select: {
      id: true,
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
    const reminderDismissedAt =
      typeof payload.reminderDismissedAt === "string" ? payload.reminderDismissedAt : null;
    const adminReviewedAt = typeof payload.adminReviewedAt === "string" ? payload.adminReviewedAt : null;
    const latestActivity = row.activities[0];

    if (!plannedFor || !reminderAt || Number.isNaN(plannedFor.getTime()) || Number.isNaN(reminderAt.getTime())) {
      return false;
    }

    const isDue = reminderDismissedAt == null && reminderAt.getTime() <= now.getTime();
    const isUpcoming = reminderDismissedAt == null && reminderAt.getTime() > now.getTime();

    if (state === "due" && !isDue) return false;
    if (state === "upcoming" && !isUpcoming) return false;
    if (state === "dismissed" && reminderDismissedAt == null) return false;
    if (review === "reviewed" && adminReviewedAt == null) return false;
    if (review === "unreviewed" && adminReviewedAt != null) return false;
    if (actor !== "all" && getActivityActor(latestActivity?.note ?? null, latestActivity?.action ?? null) !== actor) return false;

    return reminderDismissedAt == null;
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
          note: formatFormActivityNote("Admin", "Bulk dismissed reminder from broker drilldown"),
        },
      });
    })
  );

  revalidatePath("/admin/content-ops");
  revalidatePath(`/admin/content-ops/brokers/${brokerId}`);
  revalidatePath("/admin/dashboard");
}

async function rescheduleBrokerReminders(formData: FormData) {
  "use server";

  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/content-ops");

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/admin");

  const brokerId = String(formData.get("brokerId") ?? "");
  const state = String(formData.get("state") ?? "all");
  const review = String(formData.get("review") ?? "all");
  const actor = String(formData.get("actor") ?? "all");
  const plannedForRaw = String(formData.get("plannedFor") ?? "").trim();
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (confirmation !== "CONFIRM") return;

  if (!brokerId || !plannedForRaw) return;

  const nextPlannedFor = new Date(plannedForRaw);
  if (Number.isNaN(nextPlannedFor.getTime())) return;

  const rows = await prisma.formSubmission.findMany({
    where: {
      formType: "broker_content_pack",
      assignedTo: brokerId,
    },
    select: {
      id: true,
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
    const reminderDismissedAt =
      typeof payload.reminderDismissedAt === "string" ? payload.reminderDismissedAt : null;
    const adminReviewedAt = typeof payload.adminReviewedAt === "string" ? payload.adminReviewedAt : null;
    const latestActivity = row.activities[0];

    if (!plannedFor || !reminderAt || Number.isNaN(plannedFor.getTime()) || Number.isNaN(reminderAt.getTime())) {
      return false;
    }

    const isDue = reminderDismissedAt == null && reminderAt.getTime() <= now.getTime();
    const isUpcoming = reminderDismissedAt == null && reminderAt.getTime() > now.getTime();

    if (state === "due" && !isDue) return false;
    if (state === "upcoming" && !isUpcoming) return false;
    if (state === "dismissed" && reminderDismissedAt == null) return false;
    if (review === "reviewed" && adminReviewedAt == null) return false;
    if (review === "unreviewed" && adminReviewedAt != null) return false;
    if (actor !== "all" && getActivityActor(latestActivity?.note ?? null, latestActivity?.action ?? null) !== actor) return false;

    return true;
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
          note: formatFormActivityNote("Admin", `Bulk rescheduled publish from broker drilldown to ${nextPlannedFor.toISOString()}`),
        },
      });
    })
  );

  revalidatePath("/admin/content-ops");
  revalidatePath(`/admin/content-ops/brokers/${brokerId}`);
  revalidatePath("/admin/dashboard");
}

export default async function AdminBrokerContentOpsPage({
  params,
  searchParams,
}: {
  params: Promise<{ brokerId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/content-ops");

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/admin");

  const role = await getUserRole();
  const { brokerId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const stateFilter = typeof resolvedSearchParams.state === "string" ? resolvedSearchParams.state : "all";
  const reviewFilter = typeof resolvedSearchParams.review === "string" ? resolvedSearchParams.review : "all";
  const actorFilter = typeof resolvedSearchParams.actor === "string" ? resolvedSearchParams.actor : "all";

  const broker = await prisma.user.findUnique({
    where: { id: brokerId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!broker) redirect("/admin/content-ops");

  const rows = await prisma.formSubmission.findMany({
    where: {
      formType: "broker_content_pack",
      assignedTo: brokerId,
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
    take: 250,
  });

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

      return {
        id: row.id,
        brokerName: broker.name ?? "Unknown broker",
        brokerEmail: broker.email ?? "No email",
        title: typeof payload.title === "string" ? payload.title : "Saved content pack",
        folder: typeof payload.folder === "string" && payload.folder.trim() ? payload.folder : "General",
        plannedFor,
        reminderAt,
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
        item.plannedFor &&
        item.reminderAt &&
        !Number.isNaN(item.plannedFor.getTime()) &&
        !Number.isNaN(item.reminderAt.getTime())
    )
    .filter((item) => {
      const isDue = item.reminderDismissedAt == null && (item.reminderAt?.getTime() ?? Infinity) <= now.getTime();
      const isUpcoming = item.reminderDismissedAt == null && (item.reminderAt?.getTime() ?? Infinity) > now.getTime();

      if (stateFilter === "due") return isDue;
      if (stateFilter === "upcoming") return isUpcoming;
      if (stateFilter === "dismissed") return item.reminderDismissedAt != null;
      return true;
    })
    .filter((item) => {
      if (reviewFilter === "reviewed") return item.adminReviewedAt != null;
      if (reviewFilter === "unreviewed") return item.adminReviewedAt == null;
      return true;
    })
    .filter((item) => {
      if (actorFilter === "all") return true;
      return getActivityActor(item.latestActivityNote, item.latestActivityAction) === actorFilter;
    })
    .sort((a, b) => (a.reminderAt?.getTime() ?? 0) - (b.reminderAt?.getTime() ?? 0));

  const dueNow = reminderItems.filter(
    (item) => item.reminderDismissedAt == null && (item.reminderAt?.getTime() ?? Infinity) <= now.getTime()
  );
  const upcoming = reminderItems.filter(
    (item) => item.reminderDismissedAt == null && (item.reminderAt?.getTime() ?? Infinity) > now.getTime()
  );
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
  const csvRows = [
    [
      "Submission ID",
      "Pack",
      "Folder",
      "Reminder At",
      "Publish At",
      "State",
      "Reviewed At",
      "Reviewed By",
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
        item.title,
        item.folder,
        item.reminderAt ? item.reminderAt.toISOString() : "",
        item.plannedFor ? item.plannedFor.toISOString() : "",
        item.reminderDismissedAt ? "dismissed" : isDue ? "due now" : "upcoming",
        item.adminReviewedAt ?? "",
        item.adminReviewedBy ?? "",
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
    broker: {
      id: brokerId,
      name: broker.name ?? null,
      email: broker.email ?? null,
    },
    filters: {
      state: stateFilter,
      review: reviewFilter,
      actor: actorFilter,
    },
    totals: {
      visibleItems: reminderItems.length,
      activeReminders: activeReminderCount,
      reviewed: reviewed.length,
      pendingReview: pendingReviewCount,
    },
    items: reminderItems.map((item) => {
      const isDue = item.reminderDismissedAt == null && (item.reminderAt?.getTime() ?? Infinity) <= now.getTime();
      return {
        id: item.id,
        pack: {
          title: item.title,
          folder: item.folder,
        },
        schedule: {
          plannedFor: item.plannedFor ? item.plannedFor.toISOString() : null,
          reminderAt: item.reminderAt ? item.reminderAt.toISOString() : null,
        },
        reminderState: {
          dismissedAt: item.reminderDismissedAt,
          status: item.reminderDismissedAt ? "dismissed" : isDue ? "due now" : "upcoming",
        },
        review: {
          adminReviewedAt: item.adminReviewedAt,
          adminReviewedBy: item.adminReviewedBy,
          adminReviewNote: item.adminReviewNote,
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
    "BROKER CONTENT OPS LEGAL EVIDENCE",
    `Exported At: ${legalPacket.exportedAt}`,
    `Broker: ${broker.name ?? "Unknown broker"} <${broker.email ?? "no-email"}>`,
    `Visible Items: ${reminderItems.length}`,
    `Filters: state=${stateFilter} | review=${reviewFilter} | actor=${actorFilter}`,
    "",
    ...reminderItems.flatMap((item, index) => {
      const isDue = item.reminderDismissedAt == null && (item.reminderAt?.getTime() ?? Infinity) <= now.getTime();
      const state = item.reminderDismissedAt ? "dismissed" : isDue ? "due now" : "upcoming";
      return [
        `#${index + 1} ${item.title}`,
        `Submission ID: ${item.id}`,
        `Folder: ${item.folder}`,
        `Publish At: ${item.plannedFor ? item.plannedFor.toISOString() : "n/a"}`,
        `Reminder At: ${item.reminderAt ? item.reminderAt.toISOString() : "n/a"}`,
        `Reminder State: ${state}`,
        `Reviewed At: ${item.adminReviewedAt ?? "n/a"}`,
        `Reviewed By: ${item.adminReviewedBy ?? "n/a"}`,
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
    all: `/admin/content-ops/brokers/${encodeURIComponent(brokerId)}?${new URLSearchParams({
      ...(stateFilter !== "all" ? { state: stateFilter } : {}),
      ...(reviewFilter !== "all" ? { review: reviewFilter } : {}),
    }).toString()}`,
    Admin: `/admin/content-ops/brokers/${encodeURIComponent(brokerId)}?${new URLSearchParams({
      ...(stateFilter !== "all" ? { state: stateFilter } : {}),
      ...(reviewFilter !== "all" ? { review: reviewFilter } : {}),
      actor: "Admin",
    }).toString()}`,
    Broker: `/admin/content-ops/brokers/${encodeURIComponent(brokerId)}?${new URLSearchParams({
      ...(stateFilter !== "all" ? { state: stateFilter } : {}),
      ...(reviewFilter !== "all" ? { review: reviewFilter } : {}),
      actor: "Broker",
    }).toString()}`,
    Client: `/admin/content-ops/brokers/${encodeURIComponent(brokerId)}?${new URLSearchParams({
      ...(stateFilter !== "all" ? { state: stateFilter } : {}),
      ...(reviewFilter !== "all" ? { review: reviewFilter } : {}),
      actor: "Client",
    }).toString()}`,
    System: `/admin/content-ops/brokers/${encodeURIComponent(brokerId)}?${new URLSearchParams({
      ...(stateFilter !== "all" ? { state: stateFilter } : {}),
      ...(reviewFilter !== "all" ? { review: reviewFilter } : {}),
      actor: "System",
    }).toString()}`,
  } as const;
  const quickScopeHrefs = {
    due: `/admin/content-ops/brokers/${encodeURIComponent(brokerId)}?${new URLSearchParams({
      state: "due",
      ...(reviewFilter !== "all" ? { review: reviewFilter } : {}),
      ...(actorFilter !== "all" ? { actor: actorFilter } : {}),
    }).toString()}`,
    upcoming: `/admin/content-ops/brokers/${encodeURIComponent(brokerId)}?${new URLSearchParams({
      state: "upcoming",
      ...(reviewFilter !== "all" ? { review: reviewFilter } : {}),
      ...(actorFilter !== "all" ? { actor: actorFilter } : {}),
    }).toString()}`,
    reviewed: `/admin/content-ops/brokers/${encodeURIComponent(brokerId)}?${new URLSearchParams({
      ...(stateFilter !== "all" ? { state: stateFilter } : {}),
      review: "reviewed",
      ...(actorFilter !== "all" ? { actor: actorFilter } : {}),
    }).toString()}`,
    all: `/admin/content-ops/brokers/${encodeURIComponent(brokerId)}?${new URLSearchParams({
      ...(actorFilter !== "all" ? { actor: actorFilter } : {}),
    }).toString()}`,
  } as const;

  return (
    <HubLayout
      title="Broker content ops"
      hubKey="admin"
      navigation={hubNavigation.admin}
      showAdminInSwitcher={isHubAdminRole(role)}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold">
              Broker Drilldown
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{broker.name ?? "Unknown broker"}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Review this broker&apos;s content reminder workload, reviewed notes, and scheduled campaign timing from one focused admin view.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/content-ops"
              className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/85 hover:border-premium-gold/40 hover:text-white"
            >
              Back to content ops
            </Link>
            <Link
              href={`/admin/users?search=${encodeURIComponent(broker.email ?? "")}`}
              className="rounded-xl border border-premium-gold/40 bg-premium-gold/10 px-4 py-2 text-sm font-semibold text-premium-gold hover:bg-premium-gold/20"
            >
              Open user record
            </Link>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard href={quickScopeHrefs.due} label="Due now" value={String(dueNow.length)} sublabel="Reminder windows already open" tone="red" />
          <StatCard href={quickScopeHrefs.upcoming} label="Upcoming" value={String(upcoming.length)} sublabel="Reminder windows still ahead" tone="green" />
          <StatCard href={quickScopeHrefs.reviewed} label="Reviewed" value={String(reviewed.length)} sublabel="Items checked by admin" tone="green" />
          <StatCard href={quickScopeHrefs.all} label="Total items" value={String(reminderItems.length)} sublabel="Current broker reminder workload" tone="gold" />
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Broker controls</h2>
            <div className="flex flex-wrap gap-2">
              <a
                href={csvHref}
                download={`broker-content-ops-${brokerId}.csv`}
                className="rounded-xl border border-emerald-400/30 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-500/10"
              >
                Export this broker CSV
              </a>
              <a
                href={jsonHref}
                download={`broker-content-ops-${brokerId}-legal-packet.json`}
                className="rounded-xl border border-sky-400/30 px-4 py-2 text-sm text-sky-100 hover:bg-sky-500/10"
              >
                Export legal packet
              </a>
              <a
                href={evidenceHref}
                download={`broker-content-ops-${brokerId}-evidence.txt`}
                className="rounded-xl border border-fuchsia-400/30 px-4 py-2 text-sm text-fuchsia-100 hover:bg-fuchsia-500/10"
              >
                Export evidence
              </a>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-premium-gold/20 bg-premium-gold/5 p-4">
            <p className="text-sm font-medium text-white">Current action scope</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Visible items</p>
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
              Bulk actions below will apply only to the currently visible broker queue.
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
          <form className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
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
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-xl border border-premium-gold/40 bg-premium-gold/10 px-4 py-3 text-sm font-semibold text-premium-gold hover:bg-premium-gold/20"
              >
                Apply
              </button>
              <Link
                href={`/admin/content-ops/brokers/${encodeURIComponent(brokerId)}`}
                className="rounded-xl border border-white/15 px-4 py-3 text-sm text-white/85 hover:border-premium-gold/40 hover:text-white"
              >
                Reset
              </Link>
            </div>
          </form>
          <form action={markBrokerItemsReviewed} className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <input type="hidden" name="brokerId" value={brokerId} />
            <input type="hidden" name="state" value={stateFilter} />
            <input type="hidden" name="review" value={reviewFilter} />
            <input type="hidden" name="actor" value={actorFilter} />
            <input
              type="text"
              name="reviewNote"
              placeholder="bulk review note"
              className="min-w-[220px] flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-premium-gold/40"
            />
            <button
              type="submit"
              className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/20"
            >
              Mark visible items reviewed
            </button>
          </form>
          <form action={clearBrokerItemReviews} className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <input type="hidden" name="brokerId" value={brokerId} />
            <input type="hidden" name="state" value={stateFilter} />
            <input type="hidden" name="review" value={reviewFilter} />
            <input type="hidden" name="actor" value={actorFilter} />
            <p className="text-sm text-slate-400">
              Clear review metadata from the currently visible reviewed items.
            </p>
            <button
              type="submit"
              className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/85 hover:border-premium-gold/40 hover:text-white"
            >
              Clear visible reviews
            </button>
          </form>
          <form action={dismissBrokerReminders} className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <input type="hidden" name="brokerId" value={brokerId} />
            <input type="hidden" name="state" value={stateFilter} />
            <input type="hidden" name="review" value={reviewFilter} />
            <input type="hidden" name="actor" value={actorFilter} />
            <p className="text-sm text-slate-400">
              Dismiss the currently visible active reminder windows.
            </p>
            <input
              type="text"
              name="confirmation"
              placeholder="Type CONFIRM"
              className="min-w-[180px] rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-premium-gold/40"
            />
            <button
              type="submit"
              className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-100 hover:bg-amber-500/20"
            >
              Dismiss visible reminders
            </button>
          </form>
          <form action={rescheduleBrokerReminders} className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <input type="hidden" name="brokerId" value={brokerId} />
            <input type="hidden" name="state" value={stateFilter} />
            <input type="hidden" name="review" value={reviewFilter} />
            <input type="hidden" name="actor" value={actorFilter} />
            <input
              type="datetime-local"
              name="plannedFor"
              className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-premium-gold/40"
            />
            <input
              type="text"
              name="confirmation"
              placeholder="Type CONFIRM"
              className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-premium-gold/40"
            />
            <p className="text-sm text-slate-400">
              Set one new publish datetime for all visible items and reopen reminder tracking.
            </p>
            <button
              type="submit"
              className="rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-100 hover:bg-sky-500/20"
            >
              Reschedule visible reminders
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Reminder items</h2>
            <span className="text-xs text-slate-500">
              {broker.email} · {stateFilter}/{reviewFilter}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {reminderItems.length === 0 ? (
              <p className="text-sm text-slate-500">No reminder items found for this broker.</p>
            ) : (
              reminderItems.map((item) => {
                const isDue =
                  item.reminderDismissedAt == null && (item.reminderAt?.getTime() ?? Infinity) <= now.getTime();
                return (
                  <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.folder} · Reminder{" "}
                          {item.reminderAt ? item.reminderAt.toISOString().slice(0, 16).replace("T", " ") : "—"} ·
                          Publish {item.plannedFor ? item.plannedFor.toISOString().slice(0, 16).replace("T", " ") : "—"}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          Review:{" "}
                          {item.adminReviewedAt
                            ? `${new Date(item.adminReviewedAt).toISOString().slice(0, 16).replace("T", " ")}${item.adminReviewNote ? ` · ${item.adminReviewNote}` : ""}`
                            : "Pending"}
                        </p>
                        {item.latestActivityAt ? (
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            {(() => {
                              const latest = parseActivityNote(item.latestActivityNote, item.latestActivityAction);
                              return (
                                <>
                                  <span>Last activity: {new Date(item.latestActivityAt).toISOString().slice(0, 16).replace("T", " ")}</span>
                                  {latest.actor ? <ActivityBadge actor={latest.actor} /> : null}
                                  <span>{latest.detail}</span>
                                </>
                              );
                            })()}
                          </div>
                        ) : null}
                        {item.activityHistory.length > 1 ? (
                          <details className="mt-2 text-xs text-slate-400">
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
                        <form action={addBrokerAdminActivityNote} className="mt-3 flex max-w-md flex-wrap items-end gap-2">
                          <input type="hidden" name="brokerId" value={brokerId} />
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
                      </div>
                      <div className="flex flex-col items-end gap-2">
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
                        <Link
                          href="/dashboard/broker/content-studio"
                          className="text-xs font-medium text-premium-gold hover:underline"
                        >
                          Open studio →
                        </Link>
                        <LegalPacketLink
                          href={`/admin/content-ops/items/${encodeURIComponent(item.id)}`}
                          className="text-xs font-medium text-sky-200 hover:text-sky-100 hover:underline"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
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
  tone: "red" | "green" | "gold";
}) {
  const toneClass =
    tone === "red"
      ? "border-red-400/20 bg-red-500/5 text-red-200"
      : tone === "green"
        ? "border-emerald-400/20 bg-emerald-500/5 text-emerald-200"
        : "border-premium-gold/20 bg-premium-gold/5 text-premium-gold";

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
