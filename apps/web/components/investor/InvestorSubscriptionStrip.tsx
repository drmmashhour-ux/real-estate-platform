import Link from "next/link";
import { SubscriptionStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLecipmUserSubscriptionSnapshot } from "@/modules/revenue/lecipm-subscription-snapshot.service";

const ACTIVE: SubscriptionStatus[] = [SubscriptionStatus.active, SubscriptionStatus.trialing];

/** Stripe-mirrored investor workspace subscription — set `metadata.lecipmHubKind=investor` on Stripe Price/Product. */
export async function InvestorSubscriptionStrip() {
  const userId = await getGuestId();
  if (!userId) return null;

  const snap = await getLecipmUserSubscriptionSnapshot(userId);
  const ws = snap.workspace;
  const isInvestorHub = ws?.hubKind === "investor";
  const unlocked = ws && ACTIVE.includes(ws.status);

  return (
    <div className="mb-6 rounded-2xl border border-premium-gold/25 bg-black/30 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">
            Investor subscription & insights
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {!ws ? (
              <>No Stripe workspace subscription on file.</>
            ) : !isInvestorHub ? (
              <>
                Active workspace plan <span className="font-medium text-white">{ws.planCode}</span> — tag Stripe
                metadata <code className="text-xs text-slate-400">lecipmHubKind=investor</code> for investor-tier
                analytics.
              </>
            ) : unlocked ? (
              <>
                Investor tier active · plan <span className="font-medium text-white">{ws.planCode}</span>
                {ws.currentPeriodEnd ? (
                  <>
                    {" "}
                    · Current period ends{" "}
                    <time dateTime={ws.currentPeriodEnd.toISOString()}>
                      {ws.currentPeriodEnd.toLocaleDateString()}
                    </time>
                  </>
                ) : null}
              </>
            ) : (
              <>Investor hub subscription not active ({String(ws.status)}).</>
            )}
          </p>
        </div>
        <Link
          href="/investor/finance"
          className="rounded-xl border border-white/15 px-4 py-2 text-sm text-premium-gold hover:border-premium-gold/50"
        >
          Finance
        </Link>
      </div>
    </div>
  );
}
