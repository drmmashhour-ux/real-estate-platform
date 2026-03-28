import Link from "next/link";
import { AppointmentStatus, ImmoContactEventType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { BuyerHubAiSection } from "@/components/ai/BuyerHubAiSection";
import { DecisionCard } from "@/components/ai/DecisionCard";
import { safeEvaluateDecision } from "@/modules/ai/decision-engine";

export const dynamic = "force-dynamic";

function moneyCents(cents: number | null) {
  if (cents == null) return "—";
  return `$${(cents / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`;
}

export default async function BuyerDashboardPage() {
  const { userId } = await requireAuthenticatedUser();

  const [
    user,
    requests,
    advisories,
    viewRows,
    savedRows,
    mortgageRows,
    conversationParts,
    upcomingAppointments,
    contactedLogs,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { marketplacePersona: true, name: true, email: true, role: true },
    }),
    prisma.buyerRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        fsboListing: { select: { id: true, title: true, city: true } },
        conversation: { select: { id: true } },
      },
    }),
    prisma.advisoryAccess.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.buyerListingView.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        fsboListing: { select: { id: true, title: true, city: true, priceCents: true } },
      },
    }),
    prisma.buyerSavedListing.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 24,
      include: {
        fsboListing: {
          select: {
            id: true,
            title: true,
            city: true,
            priceCents: true,
            coverImage: true,
            images: true,
            listingCode: true,
          },
        },
      },
    }),
    prisma.mortgageRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        fsboListing: { select: { id: true, title: true, city: true } },
      },
    }),
    prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          select: { id: true, subject: true, lastMessageAt: true, createdAt: true, type: true },
        },
      },
    }),
    prisma.appointment.findMany({
      where: {
        clientUserId: userId,
        startsAt: { gte: new Date() },
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW],
        },
      },
      orderBy: { startsAt: "asc" },
      take: 8,
    }),
    prisma.immoContactLog.findMany({
      where: {
        userId,
        listingId: { not: null },
        contactType: {
          in: [
            ImmoContactEventType.CONTACT_FORM_SUBMITTED,
            ImmoContactEventType.CONTACT_CLICK,
            ImmoContactEventType.MESSAGE,
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const contactedListingIds = [
    ...new Set(contactedLogs.map((c) => c.listingId).filter((id): id is string => Boolean(id))),
  ];
  const contactedListings =
    contactedListingIds.length > 0
      ? await prisma.fsboListing.findMany({
          where: { id: { in: contactedListingIds } },
          select: { id: true, title: true, city: true, listingCode: true },
        })
      : [];
  const contactedById = new Map(contactedListings.map((l) => [l.id, l]));

  const seenListing = new Set<string>();
  const recentViews = viewRows
    .filter((v) => {
      if (seenListing.has(v.fsboListingId)) return false;
      seenListing.add(v.fsboListingId);
      return true;
    })
    .slice(0, 12);

  const conversationThreads = [...conversationParts]
    .sort((a, b) => {
      const ta = (a.conversation.lastMessageAt ?? a.conversation.createdAt).getTime();
      const tb = (b.conversation.lastMessageAt ?? b.conversation.createdAt).getTime();
      return tb - ta;
    })
    .slice(0, 10);

  const focusListingId = savedRows[0]?.fsboListing.id ?? recentViews[0]?.fsboListingId ?? null;
  const buyerDecision = await safeEvaluateDecision({
    hub: "buyer",
    userId,
    userRole: user?.role ?? "USER",
    entityType: focusListingId ? "listing" : "platform",
    entityId: focusListingId,
    listingVariant: focusListingId ? "fsbo" : undefined,
  });

  return (
    <main className="dashboard-shell">
      <div className="mx-auto max-w-4xl space-y-10">
        <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="section-title mb-2">Buyer hub</p>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-white md:text-4xl">Buyer dashboard</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-premium-secondary">
              Saved homes, broker and mortgage activity, and messages — role{" "}
              <span className="text-white">{user?.role ?? "—"}</span>
              {" · "}
              persona <span className="text-white">{user?.marketplacePersona ?? "UNSET"}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/buy" className="btn-secondary min-h-0 px-5 py-2.5 text-sm">
              BuyHub
            </Link>
            <Link href="/listings" className="btn-primary min-h-0 px-5 py-2.5 text-sm">
              Browse listings
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="card-premium p-6">
            <h2 className="text-lg font-semibold tracking-tight text-white">Shortcuts</h2>
            <p className="mt-1 text-sm text-premium-secondary">Navigate your workspace</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link href="/dashboard/messages" className="font-medium text-premium-gold hover:text-premium-gold-hover">
                  Messages
                </Link>
              </li>
              <li>
                <Link href="/dashboard/appointments" className="font-medium text-premium-gold hover:text-premium-gold-hover">
                  Appointments
                </Link>
              </li>
              <li>
                <Link href="/dashboard/documents" className="font-medium text-premium-gold hover:text-premium-gold-hover">
                  Documents
                </Link>
              </li>
              <li>
                <Link href="/dashboard/ai" className="font-medium text-premium-gold hover:text-premium-gold-hover">
                  AI assistant
                </Link>
              </li>
              <li>
                <Link href="/onboarding/buyer" className="text-premium-secondary transition-colors hover:text-white">
                  Re-run buyer onboarding
                </Link>
              </li>
            </ul>
          </section>

          <section className="card-premium p-6">
            <h2 className="text-lg font-semibold tracking-tight text-white">Advisory</h2>
            <p className="mt-1 text-sm text-premium-secondary">Premium guidance from listing pages</p>
            {advisories.length === 0 ? (
              <p className="mt-4 text-sm text-premium-secondary">
                No advisory purchases yet — premium guidance is available from listing pages when offered.
              </p>
            ) : (
              <ul className="mt-4 space-y-3 text-sm">
                {advisories.map((a) => (
                  <li key={a.id} className="text-white/95">
                    Plan <span className="font-medium">{a.plan}</span>
                    <span className="text-premium-secondary"> · </span>
                    {a.createdAt.toLocaleDateString()}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <BuyerHubAiSection />

        <div>
          <DecisionCard
            title="AI Property Insight"
            result={buyerDecision}
            actionHref={focusListingId ? `/listings/${focusListingId}` : "/listings"}
            actionLabel={focusListingId ? "Open listing" : "Browse listings"}
          />
        </div>

        <section className="card-premium p-6">
          <h2 className="text-lg font-semibold tracking-tight text-white">Contacted listings</h2>
          <p className="mt-1 text-sm text-premium-secondary">Your outreach history</p>
          {contactedLogs.length === 0 ? (
            <p className="mt-4 text-sm text-premium-secondary">
              Contact a seller from a listing page — your outreach history appears here.
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {contactedLogs
                .filter((c) => c.listingId && contactedById.has(c.listingId))
                .map((c) => {
                  const l = contactedById.get(c.listingId as string)!;
                  return (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-3 last:border-0"
                    >
                      <div>
                        <Link href={`/listings/${l.id}`} className="font-medium text-premium-gold hover:text-premium-gold-hover">
                          {l.title}
                        </Link>
                        <p className="text-xs text-premium-secondary">
                          {l.city}
                          {l.listingCode ? (
                            <>
                              {" "}
                              · Code: <span className="font-mono text-slate-400">{l.listingCode}</span>
                            </>
                          ) : null}
                        </p>
                        <p className="mt-1 text-xs capitalize text-premium-secondary">{String(c.contactType).toLowerCase().replace(/_/g, " ")}</p>
                      </div>
                      <span className="text-xs text-premium-secondary">{c.createdAt.toLocaleString()}</span>
                    </li>
                  );
                })}
            </ul>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Saved listings</h2>
          {savedRows.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              Save a home from a listing page while signed in — it will appear here.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {savedRows.map((s) => {
                const img = s.fsboListing.coverImage || s.fsboListing.images[0] || null;
                return (
                  <li key={s.id}>
                    <Link
                      href={`/listings/${s.fsboListing.id}`}
                      className="flex gap-3 rounded-xl border border-slate-800/80 p-3 transition hover:border-amber-500/30 hover:bg-slate-800/40"
                    >
                      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element -- remote FSBO URLs vary
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-slate-600">No photo</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-medium text-amber-400">{s.fsboListing.title}</p>
                        <p className="text-xs text-slate-500">
                          {s.fsboListing.city}
                          {s.fsboListing.listingCode ? (
                            <>
                              {" "}
                              · Code: <span className="font-mono">{s.fsboListing.listingCode}</span>
                            </>
                          ) : null}
                        </p>
                        <p className="text-xs font-semibold text-slate-200">{moneyCents(s.fsboListing.priceCents)}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Platform broker requests</h2>
          {requests.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No active requests. From a listing, use “Get help from platform broker” to open a guided thread.
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {requests.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-3 last:border-0"
                >
                  <div>
                    <Link
                      href={`/listings/${r.fsboListingId}`}
                      className="font-medium text-premium-gold hover:text-premium-gold-hover"
                    >
                      {r.fsboListing.title}
                    </Link>
                    <p className="text-xs text-premium-secondary">{r.fsboListing.city}</p>
                    {r.conversation ? (
                      <Link
                        href={`/dashboard/messages?conversationId=${encodeURIComponent(r.conversation.id)}`}
                        className="mt-1 inline-block text-xs font-medium text-sky-400/95 hover:text-sky-300"
                      >
                        Open conversation →
                      </Link>
                    ) : (
                      <p className="mt-1 text-xs text-premium-secondary">Sign in was required for messaging when you submitted.</p>
                    )}
                  </div>
                  <span className="text-xs text-premium-secondary">{r.createdAt.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card-premium p-6">
          <h2 className="text-lg font-semibold tracking-tight text-white">Mortgage requests</h2>
          <p className="mt-1 text-sm text-premium-secondary">Specialist routing from listings</p>
          {mortgageRows.length === 0 ? (
            <p className="mt-4 text-sm text-premium-secondary">
              Submit “Get mortgage advice” from a listing to route a mortgage specialist to you.
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {mortgageRows.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-3 last:border-0"
                >
                  <div>
                    <p className="text-sm text-white">
                      Status <span className="font-medium">{m.status}</span>
                      <span className="text-premium-secondary"> · </span>
                      Intent <span className="font-medium">{m.intentLevel}</span>
                    </p>
                    {m.fsboListing ? (
                      <Link
                        href={`/listings/${m.fsboListing.id}`}
                        className="text-sm text-premium-gold hover:text-premium-gold-hover"
                      >
                        {m.fsboListing.title} · {m.fsboListing.city}
                      </Link>
                    ) : (
                      <p className="text-sm text-premium-secondary">General inquiry</p>
                    )}
                  </div>
                  <span className="text-xs text-premium-secondary">{m.createdAt.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card-premium p-6">
          <h2 className="text-lg font-semibold tracking-tight text-white">Conversations</h2>
          <p className="mt-1 text-sm text-premium-secondary">Threads from broker contacts and requests</p>
          {conversationThreads.length === 0 ? (
            <p className="mt-4 text-sm text-premium-secondary">
              Threads from broker contacts and platform requests appear here.{" "}
              <Link href="/dashboard/messages" className="font-medium text-premium-gold hover:text-premium-gold-hover">
                Open inbox
              </Link>
            </p>
          ) : (
            <ul className="mt-5 space-y-2">
              {conversationThreads.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/dashboard/messages?conversationId=${encodeURIComponent(p.conversation.id)}`}
                    className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm font-medium text-premium-gold transition duration-200 hover:border-premium-gold/35 hover:bg-white/[0.04]"
                  >
                    <span className="line-clamp-2">
                      {p.conversation.subject ?? p.conversation.type}
                    </span>
                    <span className="text-xs font-normal text-premium-secondary">
                      {(p.conversation.lastMessageAt ?? p.conversation.createdAt).toLocaleString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card-premium p-6">
          <h2 className="text-lg font-semibold tracking-tight text-white">Upcoming appointments</h2>
          <p className="mt-1 text-sm text-premium-secondary">Scheduled viewings and calls</p>
          {upcomingAppointments.length === 0 ? (
            <p className="mt-4 text-sm text-premium-secondary">
              No upcoming meetings.{" "}
              <Link href="/dashboard/appointments" className="font-medium text-premium-gold hover:text-premium-gold-hover">
                View calendar
              </Link>
            </p>
          ) : (
            <ul className="mt-5 space-y-2 text-sm">
              {upcomingAppointments.map((a) => (
                <li key={a.id} className="flex flex-wrap justify-between gap-2 border-b border-white/10 pb-2 last:border-0">
                  <span className="font-medium text-white">{a.title}</span>
                  <span className="text-premium-secondary">
                    {a.startsAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card-premium p-6">
          <h2 className="text-lg font-semibold tracking-tight text-white">Recently viewed</h2>
          <p className="mt-1 text-sm text-premium-secondary">Browsing history while signed in</p>
          {recentViews.length === 0 ? (
            <p className="mt-4 text-sm text-premium-secondary">Browse listings while logged in to build this list.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {recentViews.map((v) => (
                <li key={v.id}>
                  <Link href={`/listings/${v.fsboListing.id}`} className="text-premium-gold hover:text-premium-gold-hover">
                    {v.fsboListing.title}
                  </Link>
                  <span className="text-premium-secondary"> · {v.fsboListing.city}</span>
                  <span className="text-premium-secondary"> · {moneyCents(v.fsboListing.priceCents)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
