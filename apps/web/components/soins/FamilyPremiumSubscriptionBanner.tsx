import Link from "next/link";
import { SubscriptionStatus } from "@/types/subscription-status-client";
import { getLecipmUserSubscriptionSnapshot } from "@/modules/revenue/lecipm-subscription-snapshot.service";

const ACTIVE: SubscriptionStatus[] = [SubscriptionStatus.active, SubscriptionStatus.trialing];

/** Shows Stripe-synced family premium tier when `metadata.lecipmHubKind=family_premium`. */
export async function FamilyPremiumSubscriptionBanner(props: {
  locale: string;
  country: string;
  userId: string;
}) {
  const snap = await getLecipmUserSubscriptionSnapshot(props.userId);
  const ws = snap.workspace;
  const isFamily = ws?.hubKind === "family_premium";
  const ok = ws && ACTIVE.includes(ws.status);

  return (
    <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200/90">Family Premium</p>
      <p className="mt-2 text-sm text-white/75">
        {isFamily && ok ? (
          <>
            Bundle active · plan <span className="font-medium text-white">{ws.planCode}</span>
            {ws.currentPeriodEnd ? (
              <>
                {" "}
                · Renews{" "}
                <time dateTime={ws.currentPeriodEnd.toISOString()}>
                  {ws.currentPeriodEnd.toLocaleDateString()}
                </time>
              </>
            ) : null}
          </>
        ) : (
          <>
            Standard family portal access — enable Premium in billing for alerts history, multi-seat, and dashboard
            upgrades.
          </>
        )}
      </p>
      <Link
        href={`/${props.locale}/${props.country}/signup`}
        className="mt-3 inline-flex text-sm text-emerald-300 hover:underline"
      >
        View billing options
      </Link>
    </div>
  );
}
