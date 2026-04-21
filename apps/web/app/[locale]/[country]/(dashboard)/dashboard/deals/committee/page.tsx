import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { listPipelineDealsForUser } from "@/modules/deals/deal-pipeline.service";

export const dynamic = "force-dynamic";

const COMMITTEE_STAGES = new Set(["IC_PREP", "IC_REVIEW"]);

export default async function CommitteeQueuePage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");

  const { locale, country } = await params;
  const prefix = `/${locale}/${country}`;

  const all = await listPipelineDealsForUser(userId);
  const queue = all.filter((d) => COMMITTEE_STAGES.has(d.pipelineStage));

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6 text-zinc-100">
      <div>
        <Link href={`${prefix}/dashboard/deals`} className="text-sm text-amber-400 hover:text-amber-300">
          ← Pipeline hub
        </Link>
        <h1 className="mt-4 font-serif text-2xl">Committee queue</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Deals in IC preparation or IC review (investment pipeline).
        </p>
      </div>

      {queue.length === 0 ?
        <p className="text-zinc-500">No deals awaiting committee review.</p>
      : <ul className="space-y-3">
          {queue.map((d) => (
            <li key={d.id}>
              <Link
                href={`${prefix}/dashboard/deals/${d.id}`}
                className="block rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 hover:border-zinc-700"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium text-zinc-100">{d.title}</span>
                  <span className="text-xs text-amber-200/90">{d.pipelineStage}</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Decision: {d.decisionStatus ?? "PENDING"} · {d.listing?.listingCode ?? "no listing code"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      }
    </main>
  );
}
