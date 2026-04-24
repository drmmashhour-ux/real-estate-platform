import Link from "next/link";
import { redirect } from "next/navigation";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ExpansionControlClient } from "./ExpansionControlClient";

export const metadata = {
  title: "Multi-city expansion | LECIPM / BNHub",
};

export default async function ExpansionDashboardPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/expansion");

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (me?.role !== PlatformRole.ADMIN) {
    redirect("/dashboard/admin/command-center");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-6 py-5">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Multi-city & global expansion</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Configure markets from data: countries, currencies, locales, and city readiness. Listing search can filter by{" "}
          <code className="text-zinc-500">countryCode</code> / <code className="text-zinc-500">marketCityId</code> — no
          hardcoded jurisdiction branches in app code.
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <Link href="/dashboard/admin/command-center" className="text-amber-400/90 hover:underline">
            ← Command center
          </Link>
          <Link href="/dashboard/expansion/ai" className="text-zinc-400 hover:text-zinc-200 hover:underline">
            AI expansion strategist
          </Link>
          <Link href="/api/expansion/markets" className="text-zinc-500 hover:text-zinc-300 hover:underline">
            Markets JSON
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-6xl p-6">
        <ExpansionControlClient />
      </div>
    </div>
  );
}
