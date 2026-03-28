import Link from "next/link";

type Variant = "evaluate" | "sell" | "compare";

const COPY: Record<
  Variant,
  { how: string; next: string; broker: string }
> = {
  evaluate: {
    how: "Enter a few details about your home—our tool returns an indicative range in minutes.",
    next: "You’ll see your estimate on-screen. A licensed broker can follow up for a sharper market opinion—only if you want one.",
    broker: "Brokers bring comparables, pricing strategy, and negotiation—often improving your net result even after fees.",
  },
  sell: {
    how: "Choose FSBO or broker path, publish with clear fees, and reach buyers on LECIPM.",
    next: "After you publish, you’ll manage inquiries—or we connect you with Mohamed for full-service listing support.",
    broker: "Listing exposure, paperwork, and negotiation are easier with a licensed Québec broker in your corner.",
  },
  compare: {
    how: "See FSBO vs broker side by side so you can pick what fits your goals and timeline.",
    next: "Book a free consultation or start with a free evaluation—no obligation to list.",
    broker: "Working with a broker is optional—but many sellers want professional pricing, marketing, and deal protection.",
  },
};

export function ConversionEducationStrip({ variant }: { variant: Variant }) {
  const c = COPY[variant];
  return (
    <section className="mx-auto mt-10 max-w-3xl px-4 sm:px-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["How it works", c.how],
          ["What happens next", c.next],
          ["Why work with a broker", c.broker],
        ].map(([title, body]) => (
          <div
            key={title}
            className="rounded-2xl border border-premium-gold/25 bg-[#121212] p-4 text-sm text-[#B3B3B3]"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-premium-gold">{title}</p>
            <p className="mt-2 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center">
        <Link href="/how-it-works" className="text-sm font-semibold text-premium-gold hover:underline">
          See how LECIPM works →
        </Link>
      </p>
    </section>
  );
}
