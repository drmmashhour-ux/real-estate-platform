import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const GOLD = "#D4AF37";
const BG = "#0b0b0b";

const links = [
  { href: "/ai/control-center", label: "Control center" },
  { href: "/ai", label: "Overview" },
  { href: "/ai/recommendations", label: "Recommendations" },
  { href: "/ai/approvals", label: "Approvals" },
  { href: "/ai/logs", label: "Logs" },
  { href: "/ai/automations", label: "Automations" },
  { href: "/ai/health", label: "Health" },
  { href: "/ai/learning", label: "Learning" },
  { href: "/ai/overrides", label: "Overrides" },
  { href: "/ai/settings", label: "AI settings" },
];

export default async function AiDashboardLayout({ children }: { children: ReactNode }) {
  const uid = await getGuestId();
  if (!uid) redirect("/auth/login?next=/ai");

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: BG }}>
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
              LECIPM Manager
            </p>
            <h1 className="text-xl font-semibold">AI control center</h1>
            <p className="text-sm text-white/50">AI-managed real estate &amp; stays marketplace</p>
          </div>
          <Link href="/dashboard" className="text-sm text-white/60 hover:text-white">
            ← Dashboard home
          </Link>
        </div>
        <nav className="mx-auto flex max-w-5xl flex-wrap gap-2 border-t border-white/5 px-4 py-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/80 hover:border-white/25 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
    </div>
  );
}
