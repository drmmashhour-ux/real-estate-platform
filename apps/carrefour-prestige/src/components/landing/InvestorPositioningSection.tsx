import Link from "next/link";

export function InvestorPositioningSection() {
  return (
    <section
      id="investor-positioning"
      className="border-y border-white/[0.06] bg-[#0c0c0c] py-28 md:py-36"
    >
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-serif text-3xl text-white md:text-4xl">Built for Serious Investors</h2>
        <p className="mt-6 text-lg leading-relaxed text-[#CCCCCC]">
          Analyze opportunities, track performance, and make data-driven real estate decisions with
          confidence.
        </p>
        <Link
          href="#platform-access"
          className="mt-10 inline-flex items-center justify-center rounded-lg border border-[#D4AF37] px-10 py-3.5 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
        >
          Start Investing
        </Link>
      </div>
    </section>
  );
}
