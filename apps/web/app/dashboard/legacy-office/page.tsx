import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { LegacyOfficeDashboardClient } from "./LegacyOfficeDashboardClient";

export const metadata = {
  title: "Legacy office (informational) | LECIPM",
  description: "Multi-entity ownership and governance map — not legal or tax advice.",
};

export default async function LegacyOfficeDashboardPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/legacy-office");

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-sm">
          <Link href="/dashboard/wealth-engine" className="text-teal-400/90 hover:underline">
            ← Wealth engine
          </Link>
          <Link href="/dashboard/ceo" className="text-zinc-500 hover:text-zinc-300 hover:underline">
            CEO hub
          </Link>
        </div>
      </div>
      <LegacyOfficeDashboardClient />
    </div>
  );
}
