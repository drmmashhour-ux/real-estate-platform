import Link from "next/link";
import type { WhyInvestContent } from "@/lib/city-insights";

export function CityWhyInvestSection({
  content,
  bnhubHref,
  fsboHref,
  brokerHref = "/broker",
}: {
  content: WhyInvestContent;
  bnhubHref: string;
  fsboHref: string;
  brokerHref?: string;
}) {
  return (
    <section
      className="mt-14 rounded-2xl border border-slate-200 bg-white px-5 py-8 shadow-sm sm:px-8"
      aria-labelledby="why-invest-heading"
    >
      <h2 id="why-invest-heading" className="text-xl font-bold text-slate-900">
        {content.heading}
      </h2>
      {content.paragraphs.map((p, i) => (
        <p key={i} className="mt-4 text-sm leading-relaxed text-slate-600">
          {p}
        </p>
      ))}
      <ul className="mt-6 space-y-2">
        {content.bullets.map((b) => (
          <li key={b} className="flex gap-2 text-sm text-slate-700">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-premium-gold" aria-hidden />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-slate-600">
        Explore live inventory:{" "}
        <Link href={bnhubHref} className="font-semibold text-rose-600 hover:text-rose-700">
          BNHub stays
        </Link>
        {" · "}
        <Link href={fsboHref} className="font-semibold text-[#B8941F] hover:underline">
          FSBO homes
        </Link>
        {" · "}
        <Link href={brokerHref} className="font-semibold text-slate-900 underline decoration-premium-gold/50 hover:decoration-premium-gold">
          Trusted broker support
        </Link>
        .
      </p>
    </section>
  );
}
