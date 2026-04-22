"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard/gamification", label: "Overview" },
  { href: "/dashboard/gamification/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/gamification/rewards", label: "Rewards" },
] as const;

export function GamificationSubnav() {
  const path = usePathname() ?? "";
  return (
    <nav className="mb-8 flex flex-wrap gap-2 border-b border-white/10 pb-3">
      {links.map((l) => {
        const active = path === l.href || (l.href !== "/dashboard/gamification" && path.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={
              active ?
                "rounded-lg bg-violet-500/25 px-3 py-1.5 text-sm font-semibold text-violet-100"
              : "rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
