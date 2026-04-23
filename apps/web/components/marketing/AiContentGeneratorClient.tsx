"use client";

import * as React from "react";
import Link from "next/link";

import {
  buildAutonomyEngineContextSnapshot,
  generateCaptionPack,
  generateContentIdeas,
  generateDailyContentPlan,
  generateShortFormScript,
  growthBrainCrossSellLine,
  mergeAiContentWithMarketingStack,
  packToSocialText,
  scriptToPlainText,
} from "@/modules/marketing-ai-content";

type Props = {
  marketingHubHref: string;
  calendarHref: string;
  autonomousEngineHref: string;
  growthBrainHref: string;
};

export function AiContentGeneratorClient({
  marketingHubHref,
  calendarHref,
  autonomousEngineHref,
  growthBrainHref,
}: Props) {
  const [city, setCity] = React.useState("Montréal");
  const [ideaCount, setIdeaCount] = React.useState(5);
  const [ideas, setIdeas] = React.useState(() => generateContentIdeas("Montréal", 5));
  const [pick, setPick] = React.useState(0);
  const [platform, setPlatform] = React.useState<"INSTAGRAM" | "TIKTOK" | "YOUTUBE">("INSTAGRAM");
  const [daily, setDaily] = React.useState(() => generateDailyContentPlan({ city: "Montréal", postsPerDay: 3 }));
  const [mergeMsg, setMergeMsg] = React.useState<string | null>(null);

  const selected = ideas[pick] ?? ideas[0];
  const script = selected ? generateShortFormScript(selected, platform) : null;
  const caption = selected && script ? generateCaptionPack(selected, platform, script) : null;

  const refreshIdeas = () => {
    const next = generateContentIdeas(city, ideaCount);
    setIdeas(next);
    setPick(0);
  };

  const refreshDaily = () => {
    setDaily(generateDailyContentPlan({ city, postsPerDay: 3, anchorDate: new Date() }));
  };

  const onMerge = () => {
    try {
      const r = mergeAiContentWithMarketingStack({ city });
      setMergeMsg(`Calendar +${r.calendarItemsCreated}. ${r.note}`);
    } catch (e) {
      setMergeMsg(e instanceof Error ? e.message : "Could not merge");
    }
  };

  return (
    <div className="space-y-8 text-white">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-zinc-400">
          City
          <input
            className="ml-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </label>
        <label className="text-sm text-zinc-400">
          Ideas
          <input
            type="number"
            min={1}
            max={8}
            className="ml-2 w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-zinc-100"
            value={ideaCount}
            onChange={(e) => setIdeaCount(Math.max(1, Math.min(8, parseInt(e.target.value, 10) || 3)))}
          />
        </label>
        <button
          type="button"
          onClick={refreshIdeas}
          className="rounded-lg border border-amber-600/50 bg-amber-950/30 px-4 py-2 text-sm text-amber-100 hover:border-amber-400"
        >
          Regenerate ideas
        </button>
        <div className="ml-auto flex flex-wrap gap-2 text-sm">
          <Link href={calendarHref} className="text-violet-300 hover:underline">
            Content calendar
          </Link>
          <span className="text-zinc-600">|</span>
          <Link href={autonomousEngineHref} className="text-fuchsia-300 hover:underline">
            Autonomous engine
          </Link>
          <span className="text-zinc-600">|</span>
          <Link href={growthBrainHref} className="text-emerald-300 hover:underline">
            Growth brain
          </Link>
          <span className="text-zinc-600">|</span>
          <Link href={marketingHubHref} className="text-zinc-400 hover:underline">
            Marketing hub
          </Link>
        </div>
      </div>

      <p className="text-xs text-zinc-500">{growthBrainCrossSellLine()}</p>

      <section className="rounded-2xl border border-amber-900/40 bg-gradient-to-br from-zinc-950 to-black p-5">
        <h2 className="text-lg font-semibold text-amber-100">Ideas</h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-200">
          {ideas.map((idea, i) => (
            <li key={idea.id}>
              <button
                type="button"
                onClick={() => setPick(i)}
                className={`w-full rounded-lg border px-3 py-2 text-left ${
                  i === pick ? "border-amber-500/80 bg-amber-950/25" : "border-zinc-800 hover:border-zinc-600"
                }`}
              >
                <span className="font-medium text-zinc-100">{idea.title}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">{idea.angle}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
          <h2 className="text-sm font-semibold text-zinc-200">Script (short-form)</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["INSTAGRAM", "TIKTOK", "YOUTUBE"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={
                  platform === p
                    ? "rounded-full bg-amber-500/20 px-3 py-1 text-xs text-amber-200"
                    : "rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400"
                }
              >
                {p}
              </button>
            ))}
          </div>
          {script && selected ? (
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-zinc-800 bg-black/50 p-3 text-xs text-zinc-300">
              {scriptToPlainText(script)}
              {"\n\n— on-screen: "}
              {script.onScreenText.join(" · ")}
            </pre>
          ) : null}
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
          <h2 className="text-sm font-semibold text-zinc-200">Ready to post (caption + hashtags)</h2>
          {caption ? (
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-zinc-800 bg-black/50 p-3 text-xs text-zinc-300">
              {packToSocialText(caption)}
            </pre>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-fuchsia-900/30 bg-fuchsia-950/15 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-fuchsia-100">Daily plan (1–3 posts)</h2>
          <button
            type="button"
            onClick={refreshDaily}
            className="rounded-lg border border-fuchsia-500/40 px-3 py-1.5 text-sm text-fuchsia-200"
          >
            Regenerate
          </button>
        </div>
        <ul className="mt-3 space-y-3 text-sm text-zinc-200">
          {daily.posts.map((p) => (
            <li key={p.id} className="rounded-lg border border-zinc-800 p-3">
              <p className="text-xs text-zinc-500">
                {p.slot} · {p.platform} · {p.kind}
              </p>
              <p className="mt-1 font-medium text-zinc-100">{p.idea.title}</p>
              <p className="mt-2 text-xs text-zinc-400 line-clamp-3">
                {packToSocialText(p.captions).slice(0, 220)}…
              </p>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onMerge}
          className="mt-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-100"
        >
          Push today to Content Calendar + ensure weekly plan exists
        </button>
        {mergeMsg ? <p className="mt-2 text-xs text-zinc-400">{mergeMsg}</p> : null}
      </section>

      <section className="rounded-2xl border border-zinc-800 p-4">
        <h3 className="text-sm font-medium text-zinc-300">Autonomy engine context (JSON preview)</h3>
        <pre className="mt-2 max-h-40 overflow-auto rounded bg-black/40 p-2 text-[10px] text-zinc-500">
          {JSON.stringify(buildAutonomyEngineContextSnapshot(city).slice(0, 2), null, 2)}
        </pre>
      </section>
    </div>
  );
}
