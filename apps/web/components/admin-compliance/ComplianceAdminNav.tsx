import Link from "next/link";

const LINKS = [
  { href: "/admin/compliance", label: "Overview" },
  { href: "/admin/compliance/cases", label: "Cases" },
  { href: "/admin/compliance/reviews", label: "QA reviews" },
  { href: "/admin/compliance/analytics", label: "Analytics" },
] as const;

export function ComplianceAdminNav({ active }: { active: (typeof LINKS)[number]["href"] }) {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-amber-500/15 pb-4" aria-label="Compliance workspace">
      {LINKS.map((l) => {
        const on = l.href === active;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              on
                ? "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/40"
                : "text-zinc-400 hover:bg-white/5 hover:text-amber-100"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
