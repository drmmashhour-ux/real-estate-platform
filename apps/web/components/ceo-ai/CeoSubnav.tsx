"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard/ceo", label: "Overview" },
  { href: "/dashboard/ceo/decisions", label: "Decisions" },
  { href: "/dashboard/ceo/monitoring", label: "Monitoring" },
] as const;

export function CeoSubnav() {
  const path = usePathname() ?? "";
  return (
    <nav className="mb-8 flex flex-wrap gap-2 border-b border-white/10 pb-3">
      {links.map((l) => {
        const active = path === l.href || (l.href !== "/dashboard/ceo" && path.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={
              active ?
                "rounded-lg bg-cyan-500/20 px-3 py-1.5 text-sm font-semibold text-cyan-100"
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
