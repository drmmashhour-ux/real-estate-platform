import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { ExitDashboardClient } from "./ExitDashboardClient";

export const metadata = {
  title: "Exit strategy (planning) | LECIPM",
  description:
    "Compare acquisition vs IPO readiness from your metrics — planning only, no guarantees or valuations.",
};

export default async function ExitDashboardPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/exit");

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-sm">
          <Link href="/dashboard/wealth" className="text-[#D4AF37]/90 hover:underline">
            ← Post-exit wealth (educational)
          </Link>
          <Link href="/dashboard/ceo" className="text-zinc-500 hover:text-zinc-300 hover:underline">
            CEO dashboard
          </Link>
        </div>
      </div>
      <ExitDashboardClient />
    </div>
  );
}
