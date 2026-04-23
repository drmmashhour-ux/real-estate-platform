"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import type { AcquisitionContactVm } from "@/modules/acquisition/acquisition.types";
import { getScriptByCategory } from "@/modules/sales-scripts/sales-script.service";
import type {
  SalesCallOutcome,
  SalesScriptCategory,
  SalesScriptVm,
  ScriptAudience,
  ScriptContext,
} from "@/modules/sales-scripts/sales-script.types";
import { getVariantMetadata } from "@/modules/sales-scripts/sales-script-variants.service";

const STEPS = [
  "opening_line",
  "hook",
  "value",
  "discovery",
  "objections",
  "closing",
] as const;

type StepKey = (typeof STEPS)[number];

const OUTCOMES: SalesCallOutcome[] = ["INTERESTED", "DEMO", "CLOSED", "LOST", "NO_ANSWER"];

export function AcquisitionCallAssistClient({
  contacts,
}: {
  contacts: AcquisitionContactVm[];
}) {
  const [audience, setAudience] = useState<ScriptAudience>("BROKER");
  const [category, setCategory] = useState<SalesScriptCategory>("cold_call_broker");
  const [contactId, setContactId] = useState<string>("");
  const [contactName, setContactName] = useState("");
  const [region, setRegion] = useState("");
  const [performanceTier, setPerformanceTier] = useState<ScriptContext["performanceTier"]>("average");
  const [previousInteraction, setPreviousInteraction] =
    useState<ScriptContext["previousInteraction"]>("none");
  const [stepIdx, setStepIdx] = useState(0);
  const [notes, setNotes] = useState("");
  const [objectionPick, setObjectionPick] = useState("");
  const [objectionsEncountered, setObjectionsEncountered] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<SalesCallOutcome>("INTERESTED");
  const [logStatus, setLogStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const ctx: ScriptContext = useMemo(
    () => ({
      audience,
      contactName: contactName.trim() || undefined,
      region: region.trim() || undefined,
      performanceTier,
      previousInteraction,
    }),
    [audience, contactName, region, performanceTier, previousInteraction],
  );

  const script: SalesScriptVm = useMemo(() => getScriptByCategory(category, ctx), [category, ctx]);

  const variantKey = useMemo(() => getVariantMetadata(ctx), [ctx]);

  const brokerCategories: SalesScriptCategory[] = [
    "cold_call_broker",
    "follow_up_broker",
    "demo_booking_broker",
    "closing_broker",
  ];
  const investorCategories: SalesScriptCategory[] = [
    "cold_call_investor",
    "pitch_investor",
    "follow_up_investor",
    "closing_investor",
  ];

  const categories = audience === "BROKER" ? brokerCategories : investorCategories;

  const applyContact = useCallback(
    (id: string) => {
      setContactId(id);
      const c = contacts.find((x) => x.id === id);
      if (c) {
        setContactName(c.name);
        if (c.type === "BROKER") setAudience("BROKER");
      }
    },
    [contacts],
  );

  function stepBody(key: StepKey): string | string[] | SalesScriptVm["objection_handling"] | undefined {
    switch (key) {
      case "opening_line":
        return script.opening_line;
      case "hook":
        return script.hook;
      case "value":
        return script.pitch_points?.length
          ? [script.value_proposition, ...(script.pitch_points.map((p) => `· ${p}`) ?? [])].join("\n")
          : script.value_proposition;
      case "discovery":
        return script.discovery_questions;
      case "objections":
        return script.objection_handling;
      case "closing":
        return script.closing_line;
      default:
        return "";
    }
  }

  const nextSuggestion = useMemo(() => {
    if (stepIdx >= STEPS.length - 1) return script.fallback_lines[0] ?? "";
    const next = STEPS[stepIdx + 1];
    if (next === "hook") return `Next: hook — ${script.hook.slice(0, 80)}…`;
    if (next === "value") return `Next: value — ${script.value_proposition.slice(0, 80)}…`;
    return `Continue to ${next.replace("_", " ")}`;
  }, [stepIdx, script]);

  async function submitLog() {
    setLogStatus("saving");
    try {
      const res = await fetch("/api/sales-scripts/call-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contactId || null,
          audience,
          scriptCategory: category,
          variantKey,
          outcome,
          objectionsEncountered,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("log_failed");
      setLogStatus("saved");
    } catch {
      setLogStatus("error");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <header className="rounded-2xl border border-white/10 bg-zinc-950/60 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
            Acquisition · Live call
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Script assist</h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-500">
            Premium, short lines — stay factual; show the product you can demonstrate today.
          </p>
          <p className="mt-3 text-xs text-emerald-400/90">
            <Link href="../call-assistant" className="underline hover:text-emerald-300">
              AI call assistant (live suggestions & objections)
            </Link>
          </p>
          <p className="mt-3 text-xs text-amber-200/80">{script.rep_reminder}</p>
          <p className="mt-2 font-mono text-[11px] text-zinc-500">
            Variant: <span className="text-zinc-300">{variantKey}</span>
          </p>
        </header>

        <div className="grid gap-4 rounded-2xl border border-white/10 p-6 md:grid-cols-2">
          <label className="block text-xs text-zinc-400">
            Audience
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
              value={audience}
              onChange={(e) => {
                const a = e.target.value as ScriptAudience;
                setAudience(a);
                setCategory(a === "BROKER" ? "cold_call_broker" : "cold_call_investor");
              }}
            >
              <option value="BROKER">Broker</option>
              <option value="INVESTOR">Investor</option>
            </select>
          </label>
          <label className="block text-xs text-zinc-400">
            Script
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
              value={category}
              onChange={(e) => setCategory(e.target.value as SalesScriptCategory)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-zinc-400 md:col-span-2">
            CRM contact (optional)
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
              value={contactId}
              onChange={(e) => applyContact(e.target.value)}
            >
              <option value="">— none —</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-zinc-400">
            First name (if not from CRM)
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Alex"
            />
          </label>
          <label className="block text-xs text-zinc-400">
            Region (optional)
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="montreal"
            />
          </label>
          <label className="block text-xs text-zinc-400">
            Broker tier
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
              value={performanceTier ?? "average"}
              onChange={(e) => setPerformanceTier(e.target.value as ScriptContext["performanceTier"])}
              disabled={audience !== "BROKER"}
            >
              <option value="new">new</option>
              <option value="average">average</option>
              <option value="top">top</option>
            </select>
          </label>
          <label className="block text-xs text-zinc-400">
            Previous touch
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
              value={previousInteraction ?? "none"}
              onChange={(e) =>
                setPreviousInteraction(e.target.value as ScriptContext["previousInteraction"])
              }
            >
              <option value="none">none</option>
              <option value="voicemail">voicemail</option>
              <option value="interested">interested</option>
              <option value="not_now">not now</option>
              <option value="demo_set">demo set</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
          {STEPS.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => setStepIdx(i)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                i === stepIdx ? "bg-emerald-800 text-white" : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>

        <section className="min-h-[200px] rounded-2xl border border-emerald-900/40 bg-black/40 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-400/90">
            {STEPS[stepIdx].replace("_", " ")}
          </h2>
          <div className="mt-4 text-base leading-relaxed text-white">
            {(() => {
              const body = stepBody(STEPS[stepIdx]);
              if (Array.isArray(body)) {
                if (
                  body.length > 0 &&
                  typeof body[0] === "object" &&
                  body[0] !== null &&
                  "when" in (body[0] as object)
                ) {
                  return (
                    <ul className="space-y-4">
                      {(body as SalesScriptVm["objection_handling"]).map((o) => (
                        <li key={o.when}>
                          <p className="text-xs uppercase text-zinc-500">{o.when}</p>
                          <p className="mt-1">{o.line}</p>
                        </li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <ul className="list-disc space-y-2 pl-5">
                    {(body as string[]).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                );
              }
              return <p className="whitespace-pre-wrap">{body as string}</p>;
            })()}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-40"
              disabled={stepIdx === 0}
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
            >
              Back
            </button>
            <p className="max-w-md text-xs text-zinc-500">
              <span className="font-semibold text-zinc-400">Next line hint:</span> {nextSuggestion}
            </p>
            <button
              type="button"
              className="rounded-lg bg-emerald-800 px-4 py-2 text-sm text-white hover:bg-emerald-700"
              onClick={() => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))}
            >
              Next step
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 p-6">
          <h3 className="text-sm font-semibold text-white">Objection quick tags</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {script.objection_handling.map((o) => (
              <button
                key={o.when}
                type="button"
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-zinc-300 hover:border-emerald-700"
                onClick={() => {
                  setObjectionPick(o.when);
                  setObjectionsEncountered((prev) =>
                    prev.includes(o.when) ? prev : [...prev, o.when],
                  );
                }}
              >
                {o.when}
              </button>
            ))}
          </div>
          {objectionPick ? (
            <p className="mt-3 text-sm text-emerald-200/90">
              Selected: {objectionPick} — use the matching response above.
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-white/10 p-6">
          <h3 className="text-sm font-semibold text-white">Call notes</h3>
          <textarea
            className="mt-3 min-h-[100px] w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
            placeholder="Facts from the call only…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <label className="block text-xs text-zinc-400">
              Outcome
              <select
                className="mt-1 block rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as SalesCallOutcome)}
              >
                {OUTCOMES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={logStatus === "saving"}
              onClick={() => void submitLog()}
              className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-500 disabled:opacity-50"
            >
              {logStatus === "saving" ? "Saving…" : "Log outcome"}
            </button>
            {logStatus === "saved" ? <span className="text-sm text-emerald-400">Logged.</span> : null}
            {logStatus === "error" ? <span className="text-sm text-red-400">Could not log.</span> : null}
          </div>
        </section>
      </div>

      <aside className="space-y-4 rounded-2xl border border-white/10 bg-zinc-950/80 p-5 text-sm">
        <h3 className="font-semibold text-white">Fallback lines</h3>
        <ul className="space-y-2 text-xs text-zinc-400">
          {script.fallback_lines.map((l) => (
            <li key={l} className="leading-snug">
              {l}
            </li>
          ))}
        </ul>
        <div className="border-t border-white/10 pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Mobile</h4>
          <p className="mt-2 text-xs text-zinc-500">
            Same script via <code className="text-zinc-400">GET /api/sales-scripts</code> and log via{" "}
            <code className="text-zinc-400">POST /api/sales-scripts/call-log</code>.
          </p>
        </div>
      </aside>
    </div>
  );
}
