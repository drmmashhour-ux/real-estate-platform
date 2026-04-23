import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { FinanceActionButton } from "@/components/admin/FinanceActionButton";

export const dynamic = "force-dynamic";

function money(cents: number | null | undefined) {
  return `$${(((cents ?? 0) / 100) | 0).toLocaleString("en-CA")}`;
}

export default async function AdminFollowUpPage() {
  const uid = await getGuestId();
  const admin = await requireAdminUser(uid);
  if (!admin) redirect("/admin");

  const [profiles, queue, birthdayProfiles] = await Promise.all([
    prisma.clientInterestProfile.findMany({
      orderBy: [{ interestScore: "desc" }, { updatedAt: "desc" }],
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.clientFollowUpQueue.findMany({
      orderBy: [{ status: "asc" }, { scheduledAt: "asc" }],
      take: 30,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.clientCelebrationProfile.findMany({
      where: { allowBirthdayTouch: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const hotCount = profiles.filter((profile) => profile.intentStage === "hot").length;
  const warmCount = profiles.filter((profile) => profile.intentStage === "warm").length;
  const pendingCount = queue.filter((row) => row.status === "PENDING").length;
  const sentCount = queue.filter((row) => row.status === "SENT").length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold">Client intelligence</p>
          <h1 className="mt-2 text-3xl font-semibold">Follow-up engine</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Monitor interest scoring, queued follow-ups, inactivity nudges, and birthday-touch consent from one admin
            control surface.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/dashboard" className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/85 hover:border-premium-gold/40 hover:text-white">
            AdminHub
          </Link>
          <Link href="/admin/growth-dashboard" className="rounded-xl border border-premium-gold/40 bg-premium-gold/10 px-4 py-2 text-sm font-semibold text-premium-gold hover:bg-premium-gold/20">
            Growth dashboard
          </Link>
        </div>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Hot intent profiles" value={String(hotCount)} sublabel="High-value follow-up candidates" />
        <KpiCard label="Warm intent profiles" value={String(warmCount)} sublabel="Active but not yet broker-ready" />
        <KpiCard label="Pending queued follow-ups" value={String(pendingCount)} sublabel="Awaiting dispatch" />
        <KpiCard label="Sent follow-ups" value={String(sentCount)} sublabel="Already delivered to users" />
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Top interest profiles</h2>
            <span className="text-xs text-slate-500">Latest 20 scored users</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Client</th>
                  <th className="pb-3 pr-4 font-medium">Intent</th>
                  <th className="pb-3 pr-4 font-medium">City</th>
                  <th className="pb-3 pr-4 font-medium">Property type</th>
                  <th className="pb-3 pr-4 font-medium">Price band</th>
                  <th className="pb-3 pr-0 font-medium">Last active</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id} className="border-t border-white/10">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-white">{profile.user.name ?? "Unnamed client"}</div>
                      <div className="text-xs text-slate-500">{profile.user.email}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                          profile.intentStage === "hot"
                            ? "bg-rose-500/15 text-rose-200"
                            : profile.intentStage === "warm"
                              ? "bg-amber-500/15 text-amber-200"
                              : "bg-slate-500/15 text-slate-300"
                        }`}
                      >
                        {profile.intentStage} · {profile.interestScore}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-300">{profile.topCity ?? "—"}</td>
                    <td className="py-3 pr-4 text-slate-300">{profile.topPropertyType ?? "—"}</td>
                    <td className="py-3 pr-4 text-slate-300">
                      {profile.preferredPriceMinCents != null || profile.preferredPriceMaxCents != null
                        ? `${money(profile.preferredPriceMinCents)} - ${money(profile.preferredPriceMaxCents)}`
                        : "—"}
                    </td>
                    <td className="py-3 pr-0 text-slate-400">
                      {profile.lastActiveAt ? profile.lastActiveAt.toISOString().slice(0, 10) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-5">
          <h2 className="text-lg font-semibold text-white">Birthday consent</h2>
          <p className="mt-1 text-sm text-slate-400">
            Clients who allowed birthday greetings. This keeps celebration outreach consent-based and auditable.
          </p>
          <div className="mt-4 space-y-3">
            {birthdayProfiles.length === 0 ? (
              <p className="text-sm text-slate-500">No birthday-consent profiles yet.</p>
            ) : (
              birthdayProfiles.map((profile) => (
                <div key={profile.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="font-medium text-white">{profile.user.name ?? "Unnamed client"}</div>
                  <div className="text-xs text-slate-500">{profile.user.email}</div>
                  <div className="mt-2 text-xs text-slate-400">
                    Birth date: {profile.birthDate ? profile.birthDate.toISOString().slice(0, 10) : "—"} · Last sent:{" "}
                    {profile.lastBirthdaySentAt ? profile.lastBirthdaySentAt.toISOString().slice(0, 10) : "Never"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-white/10 bg-[#0b0b0b]/80 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Follow-up queue</h2>
          <span className="text-xs text-slate-500">Newest pending and sent items</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="pb-3 pr-4 font-medium">Client</th>
                <th className="pb-3 pr-4 font-medium">Type</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Message</th>
                <th className="pb-3 pr-4 font-medium">Scheduled</th>
                <th className="pb-3 pr-0 font-medium">Sent</th>
                <th className="pb-3 pl-4 pr-0 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => (
                <tr key={item.id} className="border-t border-white/10 align-top">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-white">{item.user.name ?? "Unnamed client"}</div>
                    <div className="text-xs text-slate-500">{item.user.email}</div>
                  </td>
                  <td className="py-3 pr-4 text-slate-300">{item.type}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                        item.status === "PENDING"
                          ? "bg-amber-500/15 text-amber-200"
                          : item.status === "SENT"
                            ? "bg-emerald-500/15 text-emerald-200"
                            : item.status === "FAILED"
                              ? "bg-rose-500/15 text-rose-200"
                              : "bg-slate-500/15 text-slate-300"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-300">
                    <div className="font-medium text-white">{item.title}</div>
                    <div className="mt-1 line-clamp-2 text-xs text-slate-500">{item.message}</div>
                  </td>
                  <td className="py-3 pr-4 text-slate-400">{item.scheduledAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                  <td className="py-3 pr-0 text-slate-400">
                    {item.sentAt ? item.sentAt.toISOString().slice(0, 16).replace("T", " ") : "—"}
                  </td>
                  <td className="py-3 pl-4 pr-0">
                    <div className="flex flex-wrap gap-3">
                      {item.status !== "SENT" ? (
                        <FinanceActionButton
                          endpoint={`/api/admin/follow-up/queue/${item.id}`}
                          method="PATCH"
                          body={{ action: "send_now" }}
                          label="Send now"
                          busyLabel="Sending..."
                          className="text-emerald-300 hover:underline disabled:opacity-50"
                          confirmMessage="Send this follow-up immediately?"
                        />
                      ) : null}
                      {item.status !== "SKIPPED" ? (
                        <FinanceActionButton
                          endpoint={`/api/admin/follow-up/queue/${item.id}`}
                          method="PATCH"
                          body={{ action: "skip" }}
                          label="Skip"
                          busyLabel="Skipping..."
                          className="text-amber-300 hover:underline disabled:opacity-50"
                        />
                      ) : null}
                      {item.status !== "PENDING" ? (
                        <FinanceActionButton
                          endpoint={`/api/admin/follow-up/queue/${item.id}`}
                          method="PATCH"
                          body={{ action: "requeue" }}
                          label="Requeue"
                          busyLabel="Requeueing..."
                          className="text-sky-300 hover:underline disabled:opacity-50"
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function KpiCard({ label, value, sublabel }: { label: string; value: string; sublabel: string }) {
  return (
    <div className="rounded-2xl border border-premium-gold/20 bg-premium-gold/[0.06] p-5 shadow-lg shadow-black/30">
      <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{sublabel}</p>
    </div>
  );
}
