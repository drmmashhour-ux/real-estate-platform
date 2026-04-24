import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { WealthEngineDashboardClient } from "./WealthEngineDashboardClient";

export const metadata = {
  title: "Wealth engine (educational) | LECIPM",
  description:
    "Scenario-based capital allocation and preservation lab — not financial advice, no return projections.",
};

export default async function WealthEngineDashboardPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/wealth-engine");

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-sm">
          <Link href="/dashboard/ceo" className="text-amber-400/90 hover:underline">
            ← CEO hub
          </Link>
          <Link href="/dashboard/command-center" className="text-zinc-500 hover:text-zinc-300 hover:underline">
            Command center
          </Link>
        </div>
      </div>
      <WealthEngineDashboardClient />
    </div>
  );
}
