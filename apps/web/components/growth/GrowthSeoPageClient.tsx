"use client";

import { useEffect, useState } from "react";
import type { GrowthSeoPageDefinition } from "@/modules/growth/seo/seo-page.service";

function trackVisit(path: string) {
  const sessionId =
    typeof window !== "undefined" && window.sessionStorage?.getItem("lecipm_growth_session")
      ? (window.sessionStorage.getItem("lecipm_growth_session") as string)
      : (() => {
          const id = `gs_${Math.random().toString(36).slice(2, 12)}`;
          try {
            window.sessionStorage.setItem("lecipm_growth_session", id);
          } catch {
            /* ignore */
          }
          return id;
        })();

  void fetch("/api/growth/funnel-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      category: "VISIT",
      path,
      sessionId,
      meta: { surface: "growth_seo_landing" },
    }),
  }).catch(() => {});
}

export function GrowthSeoLeadForm(props: { source: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMsg(null);
    try {
      const res = await fetch("/api/growth/capture-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: props.source,
          meta: { landing: props.source },
        }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
      setStatus("done");
      setMsg("Thanks — we'll follow up shortly.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <form className="flex max-w-md flex-col gap-3 sm:flex-row sm:items-end" onSubmit={onSubmit}>
      <label className="flex flex-1 flex-col gap-1 text-xs text-zinc-400">
        Work email
        <input
          type="email"
          required
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          disabled={status === "loading"}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none"
          placeholder="you@brokerage.com"
        />
      </label>
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {status === "loading" ? "Sending…" : "Get updates"}
      </button>
      {msg ?
        <p className={`sm:col-span-full text-sm ${status === "error" ? "text-red-400" : "text-emerald-400"}`}>{msg}</p>
      : null}
    </form>
  );
}

export function GrowthSeoVisitTracker(props: { path: string }) {
  useEffect(() => {
    trackVisit(props.path);
  }, [props.path]);
  return null;
}

export function GrowthSeoLeadBlock(props: { def: GrowthSeoPageDefinition }) {
  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/40 to-zinc-950 p-8">
      <h2 className="text-xl font-semibold text-white">Start with LECIPM</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Join operators scaling toward 1,000+ users with SEO landings, AI content, and measurable funnels.
      </p>
      <div className="mt-6 flex flex-wrap gap-4">
        <GrowthSeoLeadForm source={`seo:${props.def.slug}`} />
        <a
          href={props.def.ctaHref}
          className="inline-flex items-center justify-center rounded-lg border border-zinc-600 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-900"
        >
          {props.def.ctaLabel}
        </a>
      </div>
    </div>
  );
}
