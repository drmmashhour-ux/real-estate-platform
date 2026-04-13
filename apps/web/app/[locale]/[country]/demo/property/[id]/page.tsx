import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InvestorDemoClient } from "@/components/demo/InvestorDemoClient";
import { getDemoPropertyByRouteId } from "@/src/modules/demo/demoDataService";
import { getDemoStepScript, getShortTalkingPoints } from "@/src/modules/demo/demoScriptService";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function DemoPropertyPage({ params }: Props) {
  const { id } = await params;
  const property = await getDemoPropertyByRouteId(decodeURIComponent(id));
  if (!property) notFound();

  const script = getDemoStepScript("property");
  const points = getShortTalkingPoints("property");
  const otherHref =
    property.kind === "bnhub"
      ? `/demo/property/resale`
      : `/demo/property/bnhub`;

  return (
    <div className="space-y-10">
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20">
        <div className="relative aspect-[21/9] w-full bg-slate-800 sm:aspect-[3/1]">
          <Image
            src={property.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/90">
              {property.kind === "bnhub" ? "BNHUB" : "Sale listing"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{property.title}</h1>
            <p className="mt-2 text-slate-300">{property.location}</p>
            <p className="mt-4 text-3xl font-semibold text-amber-200">{property.priceLabel}</p>
          </div>
        </div>

        <div className="grid gap-8 p-6 sm:grid-cols-3 sm:p-10">
          <div className="sm:col-span-2 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Overview</h2>
            <p className="text-sm leading-relaxed text-slate-300">{property.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              {property.beds != null ? <span>{property.beds} beds</span> : null}
              {property.baths != null ? <span>{property.baths} baths</span> : null}
              {property.guests != null ? <span>Up to {property.guests} guests</span> : null}
            </div>
            <p className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200/90">
              {property.trustLine}
            </p>
          </div>

          <div className="space-y-4 rounded-xl border border-amber-900/30 bg-amber-950/10 p-5">
            <h2 className="text-sm font-semibold text-amber-200/90">Take action</h2>
            <p className="text-xs text-slate-500">Demonstrates browse → transaction intent without leaving the story.</p>
            <div className="flex flex-col gap-2">
              <span className="rounded-lg bg-white/5 px-4 py-3 text-sm font-medium text-white ring-1 ring-slate-700">
                Contact seller / broker
              </span>
              <span className="rounded-lg bg-white/5 px-4 py-3 text-sm font-medium text-white ring-1 ring-slate-700">
                Request platform broker
              </span>
              {property.kind === "bnhub" ? (
                <Link
                  href="/demo/booking"
                  className="rounded-lg bg-amber-500 px-4 py-3 text-center text-sm font-semibold text-black hover:bg-amber-400"
                >
                  Book now (demo flow)
                </Link>
              ) : (
                <Link
                  href="/demo/contact"
                  className="rounded-lg bg-amber-500 px-4 py-3 text-center text-sm font-semibold text-black hover:bg-amber-400"
                >
                  Send inquiry (demo)
                </Link>
              )}
            </div>
            {property.publicPath ? (
              <Link
                href={property.publicPath}
                className="block text-center text-xs text-amber-400/80 hover:text-amber-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open live product URL (new tab)
              </Link>
            ) : null}
            <Link href={otherHref} className="block text-center text-xs text-slate-500 hover:text-slate-400">
              Switch to {property.kind === "bnhub" ? "sale listing" : "BNHUB stay"} demo
            </Link>
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-400">{script}</p>
      <ul className="text-sm text-slate-500">
        {points.map((p) => (
          <li key={p}>— {p}</li>
        ))}
      </ul>

      <InvestorDemoClient highlightStep="property" />
    </div>
  );
}
