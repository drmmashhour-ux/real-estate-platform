import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { WealthDashboardClient } from "./WealthDashboardClient";

export const metadata = {
  title: "Post-exit wealth (educational) | LECIPM",
  description:
    "Structured capital overview after a liquidity event — educational only, no guarantees or personalized investment advice.",
};

export default async function WealthDashboardPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/wealth");

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-sm">
          <Link href="/dashboard/wealth-engine" className="text-[#D4AF37]/90 hover:underline">
            ← Multi-decade wealth engine
          </Link>
          <Link href="/dashboard/legacy-office" className="text-zinc-500 hover:text-zinc-300 hover:underline">
            Legacy office
          </Link>
        </div>
      </div>
      <WealthDashboardClient />
    </div>
  );
}
