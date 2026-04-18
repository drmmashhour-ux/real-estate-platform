import Link from "next/link";

const LINKS = [
  { segment: "", label: "Overview" },
  { segment: "/team", label: "Teams" },
  { segment: "/roster", label: "Roster" },
  { segment: "/settings", label: "Settings" },
  { segment: "/commissions", label: "Commissions" },
  { segment: "/billing", label: "Billing" },
  { segment: "/payouts", label: "Payouts" },
] as const;

export function OfficeNav({
  basePath,
  active,
}: {
  basePath: string;
  active: string;
}) {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-amber-500/20 pb-4" aria-label="Office workspace">
      {LINKS.map((l) => {
        const href = `${basePath}${l.segment}`;
        const on = active === l.segment;
        return (
          <Link
            key={l.segment || "home"}
            href={href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              on ? "bg-amber-500/15 text-amber-100 ring-1 ring-amber-500/40" : "text-zinc-400 hover:bg-white/5 hover:text-amber-100"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
