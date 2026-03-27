import Link from "next/link";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";

type Hub = {
  name: string;
  line: string;
  href?: string;
  /** Cross-cutting layer — full width, distinct styling */
  layer?: boolean;
};

const hubs: Hub[] = [
  { name: "BuyHub", line: "Search, financial insights, broker access", href: "/buy" },
  { name: "SellerHub", line: "Listing, verification, legal compliance", href: "/sell" },
  { name: "NBHub (Rent)", line: "Long-term + short-term rentals", href: "/rent" },
  { name: "MortgageHub", line: "Financing + broker matching", href: "/mortgage" },
  { name: "AI Layer", line: "Integrated across all hubs", layer: true },
];

function HubCard({ hub, delayMs }: { hub: Hub; delayMs: number }) {
  const inner = (
    <>
      <h3 className="text-lg font-semibold text-white">{hub.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        <span className="mr-1.5 text-[#C9A646]/90" aria-hidden>
          →
        </span>
        {hub.line}
      </p>
      {hub.href ? (
        <p className="mt-3 text-xs font-medium text-[#C9A646]/80">Open hub →</p>
      ) : null}
    </>
  );

  const className = hub.layer
    ? "rounded-2xl border border-[#C9A646]/35 bg-gradient-to-br from-[#C9A646]/10 via-[#C9A646]/5 to-transparent p-6 shadow-[0_0_40px_rgba(201,166,70,0.08)] transition hover:border-[#C9A646]/50"
    : "rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-[#C9A646]/30";

  if (hub.href) {
    return (
      <AnimatedReveal delayMs={delayMs}>
        <Link href={hub.href} className={`block h-full ${className} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A646]/50`}>
          {inner}
        </Link>
      </AnimatedReveal>
    );
  }

  return (
    <AnimatedReveal delayMs={delayMs}>
      <div className={className}>{inner}</div>
    </AnimatedReveal>
  );
}

export function HubsSection() {
  const productHubs = hubs.filter((h) => !h.layer);
  const aiLayer = hubs.find((h) => h.layer)!;

  return (
    <section id="hubs" className="scroll-mt-24 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Ecosystem hubs"
          title="Four hubs, one AI layer"
          subtitle="Buy, sell, rent, and finance — each with dedicated tools, shared trust, and AI where it matters."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {productHubs.map((hub, i) => (
            <HubCard key={hub.name} hub={hub} delayMs={i * 60} />
          ))}
        </div>
        <div className="mt-4">
          <HubCard hub={aiLayer} delayMs={productHubs.length * 60} />
        </div>
      </div>
    </section>
  );
}
