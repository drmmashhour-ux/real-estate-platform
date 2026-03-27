import Link from "next/link";

export const metadata = {
  title: "Compliance & FAQ | Real Estate",
  description:
    "Regulatory compliance and frequently asked questions for real estate brokerage in Quebec.",
};

const COMPLIANCE_ITEMS = [
  {
    href: "/compliance/double-representation",
    title: "Prohibition of double representation",
    description:
      "FAQ on REBA amendments (June 2022): double representation, brokerage contracts, and consumer protection in Quebec.",
  },
];

export default function CompliancePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
        >
          ← Home
        </Link>

        <header className="mt-6 border-b border-slate-800 pb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
            Compliance & FAQ
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Regulatory guidance
          </h1>
          <p className="mt-3 text-slate-400 text-sm">
            Consumer protection, REBA, and frequently asked questions for real
            estate brokerage.
          </p>
        </header>

        <ul className="mt-8 space-y-4">
          {COMPLIANCE_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-slate-700 hover:bg-slate-900/80"
              >
                <span className="font-medium text-slate-200">{item.title}</span>
                <p className="mt-1 text-sm text-slate-500">{item.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
