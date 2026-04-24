import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { EcosystemDashboardClient } from "./EcosystemDashboardClient";

export const metadata = {
  title: "Ecosystem strategy (planning) | LECIPM",
  description:
    "Map LECIPM layers, interdependencies, and organic growth signals — planning only, not competitive strategy advice.",
};

export default async function EcosystemDashboardPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/ecosystem");

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-sm">
          <Link href="/dashboard/exit" className="text-[#D4AF37]/90 hover:underline">
            ← Exit strategy
          </Link>
          <Link href="/dashboard/ceo" className="text-zinc-500 hover:text-zinc-300 hover:underline">
            CEO dashboard
          </Link>
        </div>
      </div>
      <EcosystemDashboardClient />
    </div>
  );
}
