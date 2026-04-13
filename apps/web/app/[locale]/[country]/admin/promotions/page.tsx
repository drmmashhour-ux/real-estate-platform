import Link from "next/link";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminPromotions } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsControlPage() {
  await requireAdminControlUserId();
  const campaigns = await getAdminPromotions();

  return (
    <LecipmControlShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Promotions</h1>
            <p className="mt-1 text-sm text-zinc-500">Campaigns, boosts, and featured placements.</p>
          </div>
          <p className="text-xs text-zinc-500">
            Create via{" "}
            <code className="text-zinc-400">POST /api/admin/promotions</code> or monetization tools.
          </p>
        </div>

        {campaigns.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-10 text-center text-sm text-zinc-500">
            No promotion campaigns yet. When you add one, it will appear here.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#111]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-800 bg-black/50 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Listings</th>
                    <th className="px-4 py-3">Window</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-b border-zinc-800/80">
                      <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                      <td className="px-4 py-3 text-zinc-400">{c.campaignType}</td>
                      <td className="px-4 py-3 text-zinc-400">{c.status}</td>
                      <td className="px-4 py-3 text-zinc-400">{c._count.promotions}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {c.startAt.toISOString().slice(0, 10)} – {c.endAt.toISOString().slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-xs text-zinc-600">
          <Link href="/admin/monetization" className="text-zinc-400 underline">
            Monetization hub
          </Link>
        </p>
      </div>
    </LecipmControlShell>
  );
}
