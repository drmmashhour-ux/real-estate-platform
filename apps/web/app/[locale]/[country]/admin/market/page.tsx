import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { AdminMarketClient } from "./admin-market-client";

export const dynamic = "force-dynamic";

export default async function AdminMarketDataPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?returnUrl=/admin/market");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") redirect("/");

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Market intelligence</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Live BNHUB signals (searches, listing performance, demand) plus optional manual market snapshots for the public{" "}
          <Link href="/market" className="text-amber-400 underline">
            /market
          </Link>{" "}
          trend pages (estimates only — not guarantees).
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Disclaimer: market trends and forecasts are estimates based on available data and are not guarantees of future
          performance.
        </p>
        <div className="mt-8">
          <AdminMarketClient />
        </div>
      </div>
    </main>
  );
}
