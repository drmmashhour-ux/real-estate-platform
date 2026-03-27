import Link from "next/link";
import { listMembershipPlans } from "@/src/modules/bnhub-hospitality/services/membershipService";
import { MembershipPlanCard } from "@/components/bnhub/hospitality/MembershipPlanCard";

export const dynamic = "force-dynamic";

export default async function BnhubMembershipPage() {
  const plans = await listMembershipPlans("GUEST");
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100">
      <div className="mx-auto max-w-4xl">
        <Link href="/bnhub/stays" className="text-sm text-amber-400 hover:text-amber-300">
          ← Stays
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-amber-100">BNHub membership</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Plans and billing integration are staged — pricing shown for transparency; subscribe flows are data-layer ready.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {plans.map((p) => (
            <li key={p.id}>
              <MembershipPlanCard
                name={p.name}
                code={p.membershipCode}
                priceLabel={`${(p.priceCents / 100).toFixed(2)} ${p.currency} / ${p.billingCycle}`}
                description={p.description}
              />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
