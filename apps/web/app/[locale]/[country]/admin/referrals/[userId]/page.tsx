import { notFound, redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { LegalPacketAppendixSection } from "@/components/admin/LegalPacketAppendixSection";
import { LegalPacketControlStateSection } from "@/components/admin/LegalPacketControlStateSection";
import { LegalPacketEvidenceTimelineSection } from "@/components/admin/LegalPacketEvidenceTimelineSection";
import { LegalPacketHeader } from "@/components/admin/LegalPacketHeader";
import { LegalPacketOverviewSection } from "@/components/admin/LegalPacketOverviewSection";
import { LegalPacketRecordListSection } from "@/components/admin/LegalPacketRecordListSection";
import { getReferralAnalytics, evaluateReferralRewards } from "@/lib/referrals/rewards";

export const dynamic = "force-dynamic";

export default async function AdminReferralLegalPacketPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const viewerId = await getGuestId();
  if (!viewerId) redirect("/auth/login?next=/admin/referrals");

  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true },
  });
  if (viewer?.role !== "ADMIN") redirect("/admin");

  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      referralCode: true,
      createdAt: true,
    },
  });
  if (!user) notFound();

  const analytics = await getReferralAnalytics(user.id).catch(() => ({
    clicks: 0,
    signups: 0,
    activated: 0,
    paid: 0,
    invitesSent: 0,
    conversions: 0,
    viralCoefficient: 0,
    rewards: [] as { rewardType: string; value: string }[],
  }));
  const rewardState = await evaluateReferralRewards(user.id).catch(() => ({
    activated: 0,
    paid: 0,
    rewards: [] as { rewardType: string; value: string }[],
    level: "Starter" as const,
  }));
  const referrals = await prisma.referral.findMany({
    where: { referrerId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      code: true,
      referralPublicCode: true,
      status: true,
      inviteKind: true,
      rewardGiven: true,
      rewardCreditsCents: true,
      usedAt: true,
      createdAt: true,
      usedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });
  const rewards = await prisma.referralReward.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      rewardType: true,
      value: true,
      createdAt: true,
    },
  });
  const ambassador = await prisma.ambassador.findFirst({
    where: { userId: user.id },
    select: {
      id: true,
      isActive: true,
      commission: true,
      payouts: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, amount: true, status: true, createdAt: true },
      },
    },
  });
  const commissions = await prisma.commission.findMany({
    where: { ambassador: { userId: user.id } },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      amount: true,
      sourceType: true,
      sourceId: true,
      createdAt: true,
    },
  });

  const packetData = {
    generatedAt: new Date().toISOString(),
    user,
    analytics,
    rewardState,
    referrals: referrals.map((referral) => ({
      ...referral,
      createdAt: referral.createdAt.toISOString(),
      usedAt: referral.usedAt?.toISOString() ?? null,
    })),
    rewards: rewards.map((reward) => ({
      ...reward,
      createdAt: reward.createdAt.toISOString(),
    })),
    ambassador: ambassador
      ? {
          ...ambassador,
          payouts: ambassador.payouts.map((payout) => ({
            ...payout,
            createdAt: payout.createdAt.toISOString(),
          })),
        }
      : null,
    commissions: commissions.map((commission) => ({
      ...commission,
      createdAt: commission.createdAt.toISOString(),
    })),
  };
  const packetJsonHref = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(packetData, null, 2))}`;
  const packetHtmlHref = `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Referral Legal Packet ${user.id}</title></head>
  <body style="font-family:Arial,sans-serif;background:#0f172a;color:#e5e7eb;padding:24px;">
    <h1>Referral Legal Packet</h1>
    <pre>${JSON.stringify(packetData, null, 2)}</pre>
  </body>
</html>`)}`;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <LegalPacketHeader
          backHref="/admin/referrals"
          backLabel="← Admin referrals"
          title="Referral legal packet"
          description="Single-case printable record for one referral owner, including attribution, rewards, commission state, and payout traceability."
          jsonHref={packetJsonHref}
          jsonDownload={`referral-${user.id}-legal-packet.json`}
          htmlHref={packetHtmlHref}
          htmlDownload={`referral-${user.id}-legal-packet.html`}
        />

        <LegalPacketOverviewSection
          heading={`Referral overview: ${user.name ?? user.email}`}
          cards={[
            {
              title: "Referrer",
              primary: user.name ?? user.email,
              secondary: user.email,
              meta: [`User ID: ${user.id}`, `Referral code: ${user.referralCode ?? "—"}`],
            },
            {
              title: "Program state",
              primary: rewardState.level,
              secondary: `Created ${user.createdAt.toLocaleString()}`,
              meta: [
                `Invites sent: ${analytics.invitesSent}`,
                `Clicks: ${analytics.clicks}`,
                `Conversions: ${analytics.conversions}`,
              ],
            },
          ]}
        />

        <LegalPacketControlStateSection
          heading="Control State"
          cards={[
            {
              items: [
                `Activated referrals: ${rewardState.activated}`,
                `Paid conversions: ${rewardState.paid}`,
                `Viral coefficient: ${analytics.viralCoefficient.toFixed(2)}`,
                `Rewards issued: ${rewards.length}`,
              ],
            },
            {
              items: [
                `Ambassador active: ${ambassador?.isActive ? "Yes" : "No"}`,
                `Commission rate: ${ambassador ? `${(ambassador.commission * 100).toFixed(0)}%` : "—"}`,
                `Commissions tracked: ${commissions.length}`,
                `Payouts tracked: ${ambassador?.payouts.length ?? 0}`,
              ],
            },
          ]}
          annotation={
            ambassador && ambassador.payouts.some((payout) => payout.status !== "paid")
              ? {
                  label: "Payout review",
                  body: ambassador.payouts
                    .filter((payout) => payout.status !== "paid")
                    .map((payout) => `${payout.status} · ${payout.amount} · ${payout.createdAt.toLocaleString()}`)
                    .join("\n"),
                }
              : null
          }
        />

        <LegalPacketRecordListSection
          heading="Referral Records"
          emptyText="No referral records found."
          items={referrals.map((referral) => ({
            id: referral.id,
            badges: [
              <span key="status" className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300">
                {referral.status}
              </span>,
              ...(referral.inviteKind
                ? [
                    <span key="inviteKind" className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300">
                      {referral.inviteKind}
                    </span>,
                  ]
                : []),
            ],
            title: referral.usedBy?.name ?? referral.usedBy?.email ?? referral.code,
            body: `Public code: ${referral.referralPublicCode ?? "—"} · Reward given: ${referral.rewardGiven ? "Yes" : "No"} · Credits: ${(referral.rewardCreditsCents / 100).toFixed(2)}`,
            footer: `Created ${referral.createdAt.toLocaleString()}${referral.usedAt ? ` · Used ${referral.usedAt.toLocaleString()}` : ""}`,
          }))}
        />

        <LegalPacketEvidenceTimelineSection
          heading="Revenue and Reward Timeline"
          emptyText="No rewards or commissions recorded."
          items={[
            ...rewards.map((reward) => ({
              id: `reward-${reward.id}`,
              badges: [
                <span key="reward" className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300">
                  {reward.rewardType}
                </span>,
              ],
              timestamp: reward.createdAt.toLocaleString(),
              body: reward.value,
            })),
            ...commissions.map((commission) => ({
              id: `commission-${commission.id}`,
              badges: [
                <span key="commission" className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300">
                  {commission.sourceType}
                </span>,
              ],
              timestamp: commission.createdAt.toLocaleString(),
              body: `Commission amount: ${commission.amount}`,
              footer: `Source ID: ${commission.sourceId}`,
            })),
            ...(ambassador?.payouts.map((payout) => ({
              id: `payout-${payout.id}`,
              badges: [
                <span key="payout" className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300">
                  payout
                </span>,
              ],
              timestamp: payout.createdAt.toLocaleString(),
              body: `Payout amount: ${payout.amount}`,
              footer: `Status: ${payout.status}`,
            })) ?? []),
          ]}
        />

        <LegalPacketAppendixSection
          heading="Appendix Snapshot"
          content={JSON.stringify(packetData, null, 2)}
        />
      </div>
    </main>
  );
}
