import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/properties", label: "Listings" },
  { href: "/dashboard/properties/new", label: "New listing" },
  { href: "/dashboard/offers", label: "Offers" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/contracts", label: "Contracts" },
  { href: "/dashboard/investor", label: "Investor" },
  { href: "/dashboard/broker", label: "Broker" },
  { href: "/dashboard/admin", label: "Admin" },
  { href: "/chat", label: "AI Assistant" },
];

export function DashboardSidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-emerald-900/50 bg-[#061510] p-4 md:block">
      <p className="px-2 text-xs font-semibold uppercase tracking-wider text-[#d4af37]/80">
        Workspace
      </p>
      <nav className="mt-4 flex flex-col gap-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-lg px-3 py-2 text-sm text-emerald-100/80 hover:bg-emerald-950/80 hover:text-[#d4af37]"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
