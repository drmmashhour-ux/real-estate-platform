import Link from "next/link";
import { DoubleRepresentationFaq } from "./DoubleRepresentationFaq";

export const metadata = {
  title: "Prohibition of double representation | Compliance",
  description:
    "FAQ on the prohibition of double representation and related amendments to the Real Estate Brokerage Act (REBA) in Quebec.",
};

export default function DoubleRepresentationPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/compliance"
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            ← Back to compliance
          </Link>
          <span className="text-slate-600">|</span>
          <a
            href="#faq-list"
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            Back to FAQ list
          </a>
        </div>

        <header className="mt-6 border-b border-slate-800 pb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
            FAQ
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Prohibition of double representation
          </h1>
          <p className="mt-4 text-slate-400 text-sm leading-relaxed">
            In June 2022, the Minister of Finance proposed amendments to the{" "}
            <em>Real Estate Brokerage Act</em> (REBA) to strengthen consumer
            protection by prohibiting double representation and verbal brokerage
            contracts in residential real estate brokerage in Quebec.
          </p>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Like the British Columbia regulator, Quebec prohibits real estate
            brokers from representing both parties to a real estate transaction
            simultaneously and from being bound by a brokerage contract to each
            of them. The real estate regulators in Alberta, Saskatchewan,
            Manitoba, Nova Scotia and New Brunswick also impose strict oversight
            of these situations.
          </p>
        </header>

        <nav id="faq-list" className="mt-8 scroll-mt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            FAQ list
          </p>
          <DoubleRepresentationFaq />
        </nav>
      </div>
    </main>
  );
}
