import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PLATFORM_CARREFOUR_NAME } from "@/lib/brand/platform";
import { getPublishedCaseStudies } from "@/lib/marketing/trust-content";
import { LeadCTA } from "@/components/ui/LeadCTA";

export const metadata: Metadata = {
  title: "Case studies Quebec real estate",
  description:
    "Real outcomes and proof points from Quebec property clients. Montreal, Laval, and provincial markets. Free evaluation and broker consultation.",
  keywords: [
    "Quebec real estate broker",
    "Montreal real estate broker",
    "sell property Quebec",
    "free property evaluation",
    `${PLATFORM_CARREFOUR_NAME} case studies`,
  ],
};

export default async function CaseStudiesIndexPage() {
  let studies: Awaited<ReturnType<typeof getPublishedCaseStudies>> = [];
  try {
    studies = await getPublishedCaseStudies();
  } catch {
    studies = [];
  }

  const featured = studies.find((s) => s.featured) ?? studies[0];
  const rest = featured ? studies.filter((s) => s.id !== featured.id) : studies;

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <section className="border-b border-white/10 px-4 py-14 text-center sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Proof</p>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Case studies</h1>
        <p className="mx-auto mt-4 max-w-2xl text-[#B3B3B3]">
          Real examples of challenges, approach, and results — published when we have a story worth sharing.
        </p>
      </section>

      {featured ? (
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="overflow-hidden rounded-2xl border border-premium-gold/35 bg-gradient-to-br from-[#121212] to-[#0B0B0B] shadow-xl transition hover:-translate-y-0.5">
            <div className="grid gap-0 md:grid-cols-2">
              <div className="relative aspect-[16/10] md:min-h-[280px]">
                {featured.image ? (
                  <Image src={featured.image} alt="" fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
                ) : (
                  <div className="flex h-full min-h-[200px] items-center justify-center bg-[#1a1a1a] text-sm text-[#737373]">
                    Image placeholder
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center p-8 md:p-10">
                <span className="text-xs font-bold uppercase tracking-wider text-premium-gold">Featured</span>
                <h2 className="mt-2 text-2xl font-bold text-white">{featured.title}</h2>
                {featured.city ? <p className="mt-1 text-sm text-[#737373]">{featured.city}</p> : null}
                <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-[#B3B3B3]">{featured.summary}</p>
                <Link
                  href={`/case-studies/${featured.id}`}
                  className="mt-6 inline-flex w-fit rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-bold text-[#0B0B0B] hover:bg-premium-gold"
                >
                  Read full story →
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-3xl px-4 py-12 text-center text-[#737373]">
          <p>No published case studies yet. Check back soon.</p>
        </section>
      )}

      {rest.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-white">More stories</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((c) => (
              <Link
                key={c.id}
                href={`/case-studies/${c.id}`}
                className="group rounded-2xl border border-white/10 bg-[#121212] p-5 transition hover:-translate-y-0.5 hover:border-premium-gold/40"
              >
                {c.image ? (
                  <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-lg">
                    <Image
                      src={c.image}
                      alt=""
                      fill
                      className="object-cover transition group-hover:scale-[1.02]"
                      sizes="(max-width:1024px) 100vw, 33vw"
                    />
                  </div>
                ) : null}
                <h3 className="font-semibold text-premium-gold group-hover:underline">{c.title}</h3>
                {c.city ? <p className="text-xs text-[#737373]">{c.city}</p> : null}
                <p className="mt-2 line-clamp-3 text-sm text-[#B3B3B3]">{c.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-t border-premium-gold/20 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-bold text-white">Discuss your property</h2>
          <div className="mx-auto mt-8 max-w-lg">
            <LeadCTA variant="broker" />
          </div>
        </div>
      </section>
    </main>
  );
}
