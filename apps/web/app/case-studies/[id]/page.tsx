import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PLATFORM_CARREFOUR_NAME } from "@/lib/brand/platform";
import { getPublishedCaseStudyById } from "@/lib/marketing/trust-content";
import { LeadCTA } from "@/components/ui/LeadCTA";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  let title = "Case study";
  try {
    const c = await getPublishedCaseStudyById(id);
    if (c) title = `${c.title}`;
  } catch {
    /* ignore */
  }
  return {
    title,
    description: "Quebec real estate case study — challenge, approach, and results.",
    keywords: ["Quebec real estate broker", "Montreal", "sell property Quebec", PLATFORM_CARREFOUR_NAME],
  };
}

export default async function CaseStudyDetailPage({ params }: Props) {
  const { id } = await params;
  const study = await getPublishedCaseStudyById(id).catch(() => null);
  if (!study) notFound();

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/case-studies" className="text-sm text-[#C9A646] hover:underline">
          ← All case studies
        </Link>
        <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-[#C9A646]">
          {study.city ?? "Quebec market"}
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{study.title}</h1>
        <p className="mt-4 text-lg text-[#B3B3B3]">{study.summary}</p>

        {study.image ? (
          <div className="relative mt-10 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/10">
            <Image src={study.image} alt="" fill className="object-cover" sizes="(max-width:768px) 100vw, 768px" />
          </div>
        ) : null}

        <section className="mt-12 rounded-2xl border border-white/10 bg-[#121212] p-6 sm:p-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#C9A646]">Challenge</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#E5E5E5]">{study.challenge}</p>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#121212] p-6 sm:p-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#C9A646]">Approach</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#E5E5E5]">{study.solution}</p>
        </section>

        <section className="mt-6 rounded-2xl border border-[#C9A646]/30 bg-[#121212] p-6 sm:p-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#C9A646]">Result</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#E5E5E5]">{study.result}</p>
        </section>

        <div className="mt-12 rounded-2xl border border-[#C9A646]/25 bg-[#121212] p-6 sm:p-8">
          <h2 className="text-lg font-bold text-white">Talk to a broker</h2>
          <p className="mt-2 text-sm text-[#737373]">Same professional standards — your situation is unique.</p>
          <div className="mt-6">
            <LeadCTA variant="consultation" />
          </div>
        </div>
      </article>
    </main>
  );
}
