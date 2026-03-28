import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ensureDynamicAuthRequest } from "@/lib/auth/ensure-dynamic-request";

export { dynamic, revalidate } from "@/lib/auth/protected-route-segment";

const GOLD = "var(--color-premium-gold)";
const BG = "#0B0B0B";

export default async function DashboardAdminLaunchLayout({ children }: { children: ReactNode }) {
  await ensureDynamicAuthRequest();
  const id = await getGuestId();
  if (!id) redirect("/auth/login?next=/dashboard/admin/sales");
  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen text-white" style={{ background: BG }}>
      <header className="border-b border-white/10 bg-black/50">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
              Admin · Launch &amp; sales
            </p>
            <nav className="mt-2 flex flex-wrap gap-4 text-sm">
              <Link href="/dashboard/admin" className="font-semibold hover:underline" style={{ color: GOLD }}>
                Operations
              </Link>
              <Link href="/dashboard/admin/sales" className="text-[#B3B3B3] hover:text-white hover:underline">
                Sales scripts
              </Link>
              <Link href="/dashboard/admin/daily" className="text-[#B3B3B3] hover:text-white hover:underline">
                Daily action
              </Link>
              <Link href="/dashboard/admin/kpi" className="text-[#B3B3B3] hover:text-white hover:underline">
                KPIs
              </Link>
              <Link href="/dashboard/admin/content" className="text-[#B3B3B3] hover:text-white hover:underline">
                Content &amp; traffic
              </Link>
              <Link
                href="/dashboard/admin/clients-acquisition"
                className="text-[#B3B3B3] hover:text-white hover:underline"
              >
                First 10 clients
              </Link>
              <Link href="/admin" className="text-xs text-[#737373] hover:text-[#B3B3B3]">
                ← Main admin
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
