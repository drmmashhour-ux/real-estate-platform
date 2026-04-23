import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sales agent | LECIPM",
  robots: { index: false, follow: false },
};

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const uid = await getGuestId();
  if (!uid) redirect("/auth/login?returnUrl=/agent/dashboard");

  let agent: { id: string } | null = null;
  try {
    agent = await prisma.salesAgent.findFirst({
      where: { userId: uid, active: true },
      select: { id: true },
    });
  } catch {
    /* migration pending */
  }

  if (!agent) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <span className="text-sm font-semibold text-emerald-400">Sales team</span>
          <nav className="flex gap-4 text-sm text-slate-400">
            <Link href="/agent/dashboard" className="hover:text-white">
              Dashboard
            </Link>
            <Link href="/dashboard/leads" className="hover:text-white">
              CRM leads
            </Link>
            <Link href="/dashboard" className="hover:text-white">
              Main dashboard
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
