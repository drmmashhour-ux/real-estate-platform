import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { listRecentApiUsage } from "@/lib/platform/api-usage";
import { getPartners } from "@/lib/platform/partner-registry";
import { PlatformDashboardClient } from "./PlatformDashboardClient";

function maskKey(key: string): string {
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

export const metadata = {
  title: "Platform API & partners | LECIPM",
  description: "Public API usage, partner keys, and integration presets.",
};

export default async function PlatformDashboardPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/platform");

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex gap-4">
            <Link href="/dashboard/ecosystem" className="text-[#D4AF37]/90 hover:underline">
              ← Ecosystem
            </Link>
            <Link href="/dashboard/defensibility" className="text-[#D4AF37]/90 font-bold hover:underline">
              🛡️ Defensibility
            </Link>
          </div>
          <span className="text-zinc-500">
            Docs: <code className="text-zinc-400">docs/api/README.md</code>
          </span>
        </div>
      </div>
      <PlatformDashboardClient initialPartners={initialPartners} initialUsage={initialUsage} />
    </div>
  );
}
