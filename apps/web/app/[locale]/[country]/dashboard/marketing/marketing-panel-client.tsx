"use client";

import { useMemo, useState } from "react";
import {
  generateMarketingCopy,
  generateMarketingCreatives,
  type MarketingGeneratorInput,
  type MarketingTarget,
} from "@/modules/marketing/marketing-generator.service";
import { luxuryBlackGoldTemplate } from "@/modules/marketing/templates/luxury-black-gold";
import { minimalModernTemplate } from "@/modules/marketing/templates/minimal-modern";
import { investorFocusedTemplate } from "@/modules/marketing/templates/investor-focused";
import { airbnbStyleTemplate } from "@/modules/marketing/templates/airbnb-style";
import {
  buildFacebookShareUrl,
  buildLinkedInShareUrl,
  downloadTextFile,
  instagramShareHint,
  shareNativeOrFallback,
} from "@/modules/marketing/export-share";

export function MarketingPanelClient() {
  const [target, setTarget] = useState<MarketingTarget>("host");
  const [city, setCity] = useState("Montréal");
  const [tone, setTone] = useState<MarketingGeneratorInput["tone"]>("luxury");
  const [objective, setObjective] = useState<MarketingGeneratorInput["objective"]>("sign_up");

  const input = useMemo(() => ({ target, city, tone, objective }), [target, city, tone, objective]);

  const out = useMemo(() => generateMarketingCopy(input), [input]);
  const creatives = useMemo(() => generateMarketingCreatives(input), [input]);

  const templateLabel =
    tone === "luxury"
      ? luxuryBlackGoldTemplate.name
      : tone === "modern"
        ? minimalModernTemplate.name
        : tone === "bnb"
          ? airbnbStyleTemplate.name
          : investorFocusedTemplate.name;

  function buildExportBlob(): string {
    return [
      "=== LECIPM Marketing Pack (generated) ===",
      "",
      ...out.headlines.map((h, i) => `H${i + 1}: ${h}`),
      "",
      ...out.descriptions.map((d, i) => `D${i + 1}: ${d}`),
      "",
      ...out.socialCaptions.map((s, i) => `Social ${i + 1}: ${s}`),
      "",
      out.hashtags.join(" "),
      "",
      "=== Poster / promo blocks ===",
      creatives.posterHeadline,
      creatives.posterSubhead,
      creatives.posterCta,
      "",
      creatives.listingPromotionBlurb,
      "",
      creatives.brokerPromotionBlurb,
    ].join("\n");
  }

  function copyAll() {
    void navigator.clipboard.writeText(buildExportBlob());
  }

  function downloadPack() {
    const safe = city.replace(/[^\w\-]+/g, "_").slice(0, 32) || "export";
    downloadTextFile(`lecipm-marketing-${safe}.txt`, buildExportBlob());
  }

  async function sharePack() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/bnhub`;
    const ok = await shareNativeOrFallback("LECIPM", out.headlines[0] ?? "LECIPM", url);
    if (!ok) void navigator.clipboard.writeText(`${out.headlines[0] ?? ""}\n${url}`);
  }

  const fbUrl =
    typeof window !== "undefined" ? buildFacebookShareUrl(`${window.location.origin}/lp/rent`) : "";
  const liUrl =
    typeof window !== "undefined" ? buildLinkedInShareUrl(`${window.location.origin}/listings`) : "";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 sm:grid-cols-2">
        <label className="text-sm text-zinc-400">
          Target
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value as MarketingTarget)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white"
          >
            <option value="host">Host</option>
            <option value="buyer">Buyer</option>
            <option value="investor">Investor</option>
          </select>
        </label>
        <label className="text-sm text-zinc-400">
          City
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white"
          />
        </label>
        <label className="text-sm text-zinc-400">
          Tone (template)
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as MarketingGeneratorInput["tone"])}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white"
          >
            <option value="luxury">Luxury → {luxuryBlackGoldTemplate.id}</option>
            <option value="modern">Modern → {minimalModernTemplate.id}</option>
            <option value="direct">Direct → {investorFocusedTemplate.id}</option>
            <option value="bnb">BNB-style → {airbnbStyleTemplate.id} (host copy)</option>
          </select>
        </label>
        <label className="text-sm text-zinc-400">
          Objective
          <select
            value={objective}
            onChange={(e) => setObjective(e.target.value as MarketingGeneratorInput["objective"])}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white"
          >
            <option value="sign_up">Sign up</option>
            <option value="browse_listings">Browse listings</option>
            <option value="list_property">List property</option>
            <option value="book_call">Book call</option>
          </select>
        </label>
      </div>

      <p className="text-xs text-zinc-600">
        Active template: <span className="text-zinc-400">{templateLabel}</span> — text-only; drop into Canva / Adobe
        Express.
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={copyAll}
          className="rounded-xl border border-premium-gold/40 px-4 py-2 text-sm font-semibold text-premium-gold hover:bg-premium-gold/10"
        >
          Copy all
        </button>
        <button
          type="button"
          onClick={downloadPack}
          className="rounded-xl border border-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"
        >
          Download .txt
        </button>
        <button
          type="button"
          onClick={() => void sharePack()}
          className="rounded-xl border border-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"
        >
          Share (system)
        </button>
        {fbUrl ? (
          <a
            href={fbUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"
          >
            Facebook
          </a>
        ) : null}
        {liUrl ? (
          <a
            href={liUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"
          >
            LinkedIn
          </a>
        ) : null}
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(out.socialCaptions[0] ?? "");
            window.open(instagramShareHint().openUrl, "_blank", "noopener,noreferrer");
          }}
          className="rounded-xl border border-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"
        >
          Instagram (copy caption + open app)
        </button>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Poster / listing blocks</h2>
        <div className="mt-2 rounded-xl border border-zinc-800 bg-black/40 p-4 text-sm text-zinc-300">
          <p className="text-lg font-semibold text-white">{creatives.posterHeadline}</p>
          <p className="mt-1 text-zinc-400">{creatives.posterSubhead}</p>
          <p className="mt-3 font-medium text-premium-gold/90">{creatives.posterCta}</p>
          <p className="mt-4 text-zinc-500">{creatives.listingPromotionBlurb}</p>
          <p className="mt-2 text-zinc-500">{creatives.brokerPromotionBlurb}</p>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Headlines</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-zinc-300">
          {out.headlines.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ol>
      </section>
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Descriptions</h2>
        <ul className="mt-2 space-y-2 text-sm text-zinc-400">
          {out.descriptions.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Social</h2>
        <ul className="mt-2 space-y-2 text-sm text-zinc-400">
          {out.socialCaptions.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-premium-gold/90">{out.hashtags.join(" ")}</p>
      </section>
    </div>
  );
}
