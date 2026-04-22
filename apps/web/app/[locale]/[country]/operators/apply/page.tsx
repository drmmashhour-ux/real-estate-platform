import type { Metadata } from "next";
import Link from "next/link";
import { OperatorWaitlistApplyForm } from "@/components/operators/OperatorWaitlistApplyForm";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  return buildPageMetadata({
    title: "Apply — qualified families for your residence | LECIPM",
    description:
      "Limited spots per city. Apply to receive qualified families interested in senior living.",
    path: "/operators/apply",
    locale,
    country,
  });
}

export default async function OperatorsApplyPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-black to-neutral-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-amber-500/90">
          Residence operators
        </p>
        <h1 className="mt-4 text-center font-serif text-3xl font-semibold tracking-tight md:text-4xl">
          Apply to receive qualified families
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-lg text-neutral-300">
          Limited spots per city — we send families who are actively looking, not random traffic.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-neutral-500">
          Limited partners per area — we select carefully so quality stays high for families and operators.
        </p>

        <div className="mt-12">
          <OperatorWaitlistApplyForm />
        </div>

        <p className="mt-10 text-center text-sm text-neutral-500">
          <Link href={`${base}/senior-living`} className="text-amber-500/90 underline hover:text-amber-400">
            See how families find residences
          </Link>
          {" · "}
          <Link href={`${base}`} className="text-neutral-400 underline hover:text-neutral-300">
            Home
          </Link>
        </p>
      </div>
    </div>
  );
}
