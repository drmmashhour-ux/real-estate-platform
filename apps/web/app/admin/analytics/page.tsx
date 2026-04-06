import Link from "next/link";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { requireAdminControlUserId } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsHubPage() {
  await requireAdminControlUserId();

  return (
    <LecipmControlShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-zinc-500">
          Deep analytics live in the existing dashboards. Pick a surface below.
        </p>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/admin/analytics/product" className="text-zinc-300 underline">
              Product insights
            </Link>
          </li>
          <li>
            <Link href="/admin/organic-analytics" className="text-zinc-300 underline">
              Organic analytics
            </Link>
          </li>
          <li>
            <Link href="/admin/revenue-dashboard" className="text-zinc-300 underline">
              Revenue dashboard
            </Link>
          </li>
        </ul>
      </div>
    </LecipmControlShell>
  );
}
