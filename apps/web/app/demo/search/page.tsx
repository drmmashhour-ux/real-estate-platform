import Image from "next/image";
import Link from "next/link";
import { InvestorDemoClient } from "@/components/demo/InvestorDemoClient";
import { DEMO_PROPERTY_PATHS } from "@/src/modules/demo/demoConfig";
import { getDemoFeaturedListings } from "@/src/modules/demo/demoDataService";
import { getDemoStepScript, getShortTalkingPoints } from "@/src/modules/demo/demoScriptService";

export const dynamic = "force-dynamic";

export default async function DemoSearchPage() {
  const { bnhub, resale, source } = await getDemoFeaturedListings();
  const script = getDemoStepScript("search");
  const points = getShortTalkingPoints("search");

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-semibold text-white">Search</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">{script}</p>
        <p className="mt-2 text-xs text-slate-600">
          Data:{" "}
          {source === "database"
            ? "seeded investor listings (LST-INVDEMO1 / LST-INVDEMO2)"
            : "static fallback — run pnpm seed:demo:investor for DB-backed demo rows"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300">City</span>
        <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300">Price</span>
        <span className="rounded-full border border-amber-900/40 bg-amber-950/20 px-3 py-1 text-xs text-amber-200/80">BNHub</span>
        <span className="rounded-full border border-amber-900/40 bg-amber-950/20 px-3 py-1 text-xs text-amber-200/80">For sale</span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[
          { card: bnhub, href: DEMO_PROPERTY_PATHS.bnhub },
          { card: resale, href: DEMO_PROPERTY_PATHS.resale },
        ].map(({ card, href }) => (
          <Link
            key={card.kind}
            href={href}
            className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30 transition-all hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-950/20"
          >
            <div className="relative aspect-[16/10] w-full bg-slate-800">
              <Image
                src={card.imageUrl}
                alt=""
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                sizes="(max-width:768px) 100vw, 50vw"
              />
              <div className="absolute left-3 top-3 flex flex-wrap gap-1">
                {card.badges.slice(0, 2).map((b) => (
                  <span key={b} className="rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-amber-100/90">
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/80">
                {card.kind === "bnhub" ? "BNHub stay" : "Real estate"}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">{card.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{card.location}</p>
              <p className="mt-3 text-xl font-semibold text-amber-200/90">{card.priceLabel}</p>
              <p className="mt-4 text-sm font-medium text-amber-400/90">View demo property →</p>
            </div>
          </Link>
        ))}
      </div>

      <aside className="rounded-xl border border-slate-800 bg-slate-950/50 p-5">
        <h3 className="text-xs font-semibold uppercase text-slate-500">Talking points</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          {points.map((p) => (
            <li key={p}>— {p}</li>
          ))}
        </ul>
      </aside>

      <InvestorDemoClient highlightStep="search" />
    </div>
  );
}
