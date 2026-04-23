import Link from "next/link";
import type { ReactNode } from "react";
import type { BrokerLicenceEvaluation } from "@/lib/compliance/oaciq/broker-licence-service";
import { BrokerLicenceStatusStrip } from "@/components/broker-residential/BrokerLicenceStatusStrip";

const NAV: { href: string; label: string }[] = [
  { href: "", label: "Overview" },
  { href: "/kpis", label: "KPIs" },
  { href: "/team", label: "Team" },
  { href: "/deals", label: "Deals" },
  { href: "/documents", label: "Documents" },
  { href: "/clients", label: "Clients" },
  { href: "/leads", label: "Leads" },
  { href: "/checklists", label: "Checklists" },
  { href: "/timeline", label: "Timeline" },
  { href: "/review-queue", label: "Review queue" },
];

export function BrokerResidentialShell({
  basePath,
  licence,
  children,
}: {
  basePath: string;
  licence?: BrokerLicenceEvaluation | null;
  children: ReactNode;
}) {
  const officePath = basePath.replace(/\/broker\/residential$/, "/broker/office");

  return (
    <div className="min-h-screen bg-ds-bg text-ds-text">
      <div className="border-b border-ds-border bg-black/50">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ds-gold/90">Broker agent</p>
            <h1 className="font-serif text-xl tracking-tight text-ds-text sm:text-2xl">Residential command center</h1>
            <p className="mt-1 max-w-xl text-xs text-ds-text-secondary">
              Quebec residential workflow — drafting assistance is reviewable; official OACIQ forms are not replaced here.
            </p>
          </div>
          <div className="flex max-w-md flex-col items-end gap-3">
            <BrokerLicenceStatusStrip licence={licence ?? null} />
            <Link
              href={basePath.replace(/\/broker\/residential$/, "/dashboard/broker")}
              className="text-sm text-ds-gold hover:text-amber-200"
            >
              Classic broker dashboard →
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6">
        <aside className="shrink-0 lg:w-56">
          <nav className="sticky top-6 space-y-1 rounded-2xl border border-ds-border bg-ds-card/60 p-3 shadow-ds-soft">
            {NAV.map((item) => {
              const path = `${basePath}${item.href}`;
              return (
                <Link
                  key={item.href || "home"}
                  href={path}
                  className="block rounded-lg px-3 py-2 text-sm text-ds-text-secondary transition hover:bg-white/5 hover:text-ds-gold"
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href={officePath}
              className="mt-2 block rounded-lg border border-ds-gold/25 bg-ds-gold/5 px-3 py-2 text-sm font-medium text-ds-gold transition hover:bg-ds-gold/10"
            >
              Office &amp; billing
            </Link>
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
