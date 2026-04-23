"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CloserModePanel } from "@/components/closing/CloserModePanel";
import { PsychologyCoachPanel } from "@/components/sales-psychology/PsychologyCoachPanel";
import {
  buildUltimateCloserPayload,
  recordCloserSessionEnd,
  recordCloseNowSignal,
} from "@/modules/closing";
import { buildClosingCoachBundle } from "@/modules/personality-closing/personality-response.service";
import { recordPersonalityOutcome } from "@/modules/personality-closing/personality-learning.service";
import { recordPsychologyOutcome } from "@/modules/sales-psychology/psychology-learning.service";
import type { AcquisitionContactVm } from "@/modules/acquisition/acquisition.types";
import {
  advanceStageAfterLine,
  getNextLine,
  nextDiscoveryIndex,
} from "@/modules/call-assistant/call-assistant.service";
import type { CallAssistantContext, CallStage } from "@/modules/call-assistant/call-assistant.types";
import { getScriptByCategory } from "@/modules/sales-scripts/sales-script.service";
import type {
  SalesCallOutcome,
  SalesScriptCategory,
  SalesScriptVm,
  ScriptAudience,
  ScriptContext,
} from "@/modules/sales-scripts/sales-script.types";
import { getVariantMetadata } from "@/modules/sales-scripts/sales-script-variants.service";

const OUTCOMES: SalesCallOutcome[] = ["INTERESTED", "DEMO", "CLOSED", "LOST", "NO_ANSWER"];

function useElapsedSeconds(active: boolean) {
  const startedRef = useRef<number | null>(null);
  const [sec, setSec] = useState(0);

  useEffect(() => {
    if (!active) {
      startedRef.current = null;
      setSec(0);
      return;
    }
    if (startedRef.current === null) startedRef.current = Date.now();
    const id = window.setInterval(() => {
      if (startedRef.current === null) return;
      setSec(Math.floor((Date.now() - startedRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [active]);

  return sec;
}

export function CallAssistantLiveClient({
  contacts,
  winningHints,
}: {
  contacts: AcquisitionContactVm[];
  winningHints: string[];
}) {
  const [sessionActive, setSessionActive] = useState(false);
  /** Allows logging after ending session without losing the trail */
  const [sessionEverStarted, setSessionEverStarted] = useState(false);
  const [audience, setAudience] = useState<ScriptAudience>("BROKER");
  const [category, setCategory] = useState<SalesScriptCategory>("cold_call_broker");
  const [contactId, setContactId] = useState("");
  const [contactName, setContactName] = useState("");
  const [region, setRegion] = useState("");
  const [performanceTier, setPerformanceTier] = useState<ScriptContext["performanceTier"]>("average");
  const [previousInteraction, setPreviousInteraction] =
    useState<ScriptContext["previousInteraction"]>("none");

  const [stage, setStage] = useState<CallStage>("opening");
  const [discoveryIndex, setDiscoveryIndex] = useState(0);
  const [lastProspectInput, setLastProspectInput] = useState("");
  const [objectionsEncountered, setObjectionsEncountered] = useState<string[]>([]);
  const [stagesVisited, setStagesVisited] = useState<CallStage[]>(["opening"]);
  const [suggestionMeta, setSuggestionMeta] = useState<{ stage: CallStage; usedAlternativeIndex?: number }[]>(
    [],
  );

  const [notes, setNotes] = useState("");
  const [nextActionNote, setNextActionNote] = useState("");
  const [followUpAtIso, setFollowUpAtIso] = useState("");
  const [outcome, setOutcome] = useState<SalesCallOutcome>("INTERESTED");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [listening, setListening] = useState(false);
  const [closerMode, setCloserMode] = useState(true);
  /** Last script line the rep confirmed they said — feeds control heuristic */
  const [lastRepSaid, setLastRepSaid] = useState("");

  const elapsed = useElapsedSeconds(sessionActive);

  const ctxScript: ScriptContext = useMemo(
    () => ({
      audience,
      contactName: contactName.trim() || undefined,
      region: region.trim() || undefined,
      performanceTier,
      previousInteraction,
    }),
    [audience, contactName, region, performanceTier, previousInteraction],
  );

  const script: SalesScriptVm = useMemo(() => getScriptByCategory(category, ctxScript), [category, ctxScript]);

  const variantKey = useMemo(() => getVariantMetadata(ctxScript), [ctxScript]);

  const assistantCtx: CallAssistantContext = useMemo(
    () => ({
      audience,
      scriptCategory: category,
      stage,
      discoveryIndex,
      lastProspectInput: lastProspectInput.trim() || undefined,
      scriptContext: ctxScript,
    }),
    [audience, category, stage, discoveryIndex, lastProspectInput, ctxScript],
  );

  const nextLine = useMemo(() => getNextLine(assistantCtx), [assistantCtx]);

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

  const resetSession = useCallback(() => {
    setSessionActive(false);
    setStage("opening");
    setDiscoveryIndex(0);
    setLastProspectInput("");
    setObjectionsEncountered([]);
    setStagesVisited(["opening"]);
    setSuggestionMeta([]);
    setNotes("");
    setSaveStatus("idle");
    setLastRepSaid("");
  }, []);

  const beginSession = useCallback(() => {
    setSessionActive(true);
    setStage("opening");
    setDiscoveryIndex(0);
    setLastProspectInput("");
    setStagesVisited(["opening"]);
    setSuggestionMeta([]);
    setSaveStatus("idle");
    setLastRepSaid("");
  }, []);

  function recordSuggestionPick(altIdx?: number) {
    setSuggestionMeta((prev) => [...prev, { stage, usedAlternativeIndex: altIdx }]);
  }

  function tagObjection(label: string) {
    setObjectionsEncountered((prev) => (prev.includes(label) ? prev : [...prev, label]));
  }

  const onSaidNext = useCallback(() => {
    recordSuggestionPick();
    setLastRepSaid(nextLine.suggested);
    const nextStage = advanceStageAfterLine(stage, assistantCtx);
    if (stage === "discovery" && nextStage === "discovery") {
      setDiscoveryIndex(nextDiscoveryIndex(assistantCtx));
    } else if (nextStage === "discovery") {
      setDiscoveryIndex(0);
    }
    setLastProspectInput("");
    setStage(nextStage);
    setStagesVisited((v) => [...v, nextStage]);
  }, [stage, assistantCtx, nextLine.suggested]);

  function applyProspectSnippets(text: string, objectionLabel?: string) {
    setLastProspectInput(text);
    if (objectionLabel) tagObjection(objectionLabel);
  }

  function startSpeech() {
    const SR =
      typeof window !== "undefined"
        ? ((window as unknown as { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition ??
          (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition)
        : undefined;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev: SpeechRecognitionEvent) => {
      const t = ev.results[0]?.[0]?.transcript?.trim();
      if (t) setLastProspectInput(t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  }

  async function submitComplete() {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/call-assistant/complete", {
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
          stagesVisited,
          secondsInCallApprox: elapsed,
          suggestionMeta,
          nextActionNote: nextActionNote.trim() || null,
          followUpAtIso: followUpAtIso.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("save_failed");
      const won = outcome === "DEMO" || outcome === "CLOSED";
      const coach = buildClosingCoachBundle(lastProspectInput.trim());
      const closerPayload = buildUltimateCloserPayload({
        callStage: stage,
        audience,
        lastProspectInput: lastProspectInput.trim(),
      });
      recordCloseNowSignal(Boolean(closerPayload.closeNow), won);
      if (coach) {
        recordPsychologyOutcome(coach.strategyKey, coach.detection.primaryState, won);
        recordPersonalityOutcome(coach.personality.primary, coach.strategyKey, won);
        recordCloserSessionEnd(won, coach.personality.primary);
      } else {
        recordCloserSessionEnd(won);
      }
      setSaveStatus("saved");
      setSessionActive(false);
    } catch {
      setSaveStatus("error");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-6">
        <header className="rounded-2xl border border-white/10 bg-zinc-950/60 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
            Acquisition · AI call assistant
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Live mode</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            Human-in-the-loop only: suggestions and objections — you place the call yourself. Nothing here dials or speaks
            on your behalf.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-500">
            <span>
              Timer: <span className="font-mono text-zinc-300">{sessionActive ? `${elapsed}s` : "—"}</span>
            </span>
            <span>
              Stage: <span className="text-zinc-300">{stage}</span>
            </span>
            <span>
              Variant: <span className="font-mono text-zinc-400">{variantKey}</span>
            </span>
          </div>
          {winningHints.length > 0 ? (
            <p className="mt-3 text-xs text-emerald-300/80">
              Learning hint (90d logs): prioritize scripts similar to{" "}
              <span className="font-medium text-emerald-200">{winningHints.join(", ")}</span>.
            </p>
          ) : null}
        </header>

        <div className="grid gap-4 rounded-2xl border border-white/10 p-6 md:grid-cols-2">
          <label className="block text-xs text-zinc-400">
            Audience
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
              value={audience}
              disabled={sessionActive}
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
            Script category
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
              value={category}
              disabled={sessionActive}
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
              disabled={sessionActive}
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
            First name
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
              value={contactName}
              disabled={sessionActive}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Alex"
            />
          </label>
          <label className="block text-xs text-zinc-400">
            Region
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
              value={region}
              disabled={sessionActive}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="montreal"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {!sessionActive ? (
            <button
              type="button"
              onClick={() => beginSession()}
              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Start live session
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onSaidNext()}
                className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Said it — advance flow
              </button>
              <button
                type="button"
                onClick={() => resetSession()}
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
              >
                End without saving
              </button>
            </>
          )}
        </div>

        <section className="rounded-2xl border border-emerald-900/40 bg-black/40 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-400/90">Suggested line</h2>
          <p className="mt-4 text-lg leading-relaxed text-white">{nextLine.suggested}</p>
          {nextLine.objectionLabel ? (
            <p className="mt-3 text-xs font-medium text-amber-200/90">Objection detected: {nextLine.objectionLabel}</p>
          ) : null}
          {nextLine.reminder ? <p className="mt-4 text-xs text-amber-200/70">{nextLine.reminder}</p> : null}

          <div className="mt-6 space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">Alternatives</p>
            <div className="flex flex-col gap-2">
              {nextLine.alternatives.filter(Boolean).map((alt, i) => (
                <button
                  key={`${alt}-${i}`}
                  type="button"
                  className="rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-left text-sm text-zinc-200 hover:border-emerald-800"
                  onClick={() => recordSuggestionPick(i + 1)}
                >
                  {alt}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-white">Prospect said (typed or voice)</h3>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={closerMode}
                onChange={(e) => setCloserMode(e.target.checked)}
                className="rounded border-white/20 bg-black"
              />
              Closer mode (flow + objections)
            </label>
          </div>
          <textarea
            className="mt-3 min-h-[72px] w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
            placeholder="Paste what they said — suggestions update for objections…"
            value={lastProspectInput}
            onChange={(e) => setLastProspectInput(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-white hover:bg-zinc-700"
              onClick={() => startSpeech()}
              disabled={listening}
            >
              {listening ? "Listening…" : "Speak (browser)"}
            </button>
          </div>
          {closerMode ? (
            <div className="mt-6">
              <CloserModePanel
                callStage={stage}
                audience={audience}
                lastProspectInput={lastProspectInput}
                lastRepSample={lastRepSaid}
              />
            </div>
          ) : null}
          <div className="mt-6">
            <PsychologyCoachPanel clientText={lastProspectInput} compact />
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 p-6">
          <h3 className="text-sm font-semibold text-white">Quick actions</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-white/15 px-3 py-1 text-xs text-zinc-200 hover:border-amber-700"
              onClick={() => applyProspectSnippets("I'm not interested", "not interested")}
            >
              Objection: not interested
            </button>
            <button
              type="button"
              className="rounded-full border border-white/15 px-3 py-1 text-xs text-zinc-200 hover:border-amber-700"
              onClick={() =>
                applyProspectSnippets("We're already working with someone", "already working with someone")
              }
            >
              Objection: already working with someone
            </button>
            <button
              type="button"
              className="rounded-full border border-emerald-900/50 px-3 py-1 text-xs text-emerald-200 hover:bg-emerald-950/50"
              onClick={() => {
                setStage("closing");
                setStagesVisited((v) => [...v, "closing"]);
                setNotes((n) => (n.trim() ? n : "Prospect agreed to see a demo — book slot."));
              }}
            >
              Ask for demo
            </button>
            <button
              type="button"
              className="rounded-full border border-white/15 px-3 py-1 text-xs text-zinc-200 hover:border-zinc-500"
              onClick={() => {
                setStage("closing");
                setOutcome("NO_ANSWER");
                setStagesVisited((v) => [...v, "closing"]);
              }}
            >
              Close call
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 p-6">
          <h3 className="text-sm font-semibold text-white">Full script (reference)</h3>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-zinc-300">
            <p>
              <span className="text-[11px] uppercase text-zinc-500">Opening</span>
              <br />
              {script.opening_line}
            </p>
            <p>
              <span className="text-[11px] uppercase text-zinc-500">Pitch</span>
              <br />
              {script.hook} {script.value_proposition}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 p-6">
          <h3 className="text-sm font-semibold text-white">Notes & outcome</h3>
          <textarea
            className="mt-3 min-h-[100px] w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
            placeholder="Facts from the call…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <label className="mt-4 block text-xs text-zinc-400">
            Next action (CRM note)
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
              value={nextActionNote}
              onChange={(e) => setNextActionNote(e.target.value)}
              placeholder="e.g. Send deck · call back Tuesday 2pm"
            />
          </label>
          <label className="mt-3 block text-xs text-zinc-400">
            Follow-up reminder (optional ISO time — creates admin notification)
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
              value={followUpAtIso}
              onChange={(e) => setFollowUpAtIso(e.target.value)}
              placeholder="2026-04-05T14:00:00.000Z"
            />
          </label>
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
              disabled={saveStatus === "saving" || !sessionEverStarted}
              onClick={() => void submitComplete()}
              className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-500 disabled:opacity-40"
            >
              {saveStatus === "saving" ? "Saving…" : "Save session & log"}
            </button>
            {saveStatus === "saved" ? <span className="text-sm text-emerald-400">Saved to CRM & call log.</span> : null}
            {saveStatus === "error" ? <span className="text-sm text-red-400">Could not save.</span> : null}
          </div>
        </section>

        <p className="text-xs text-zinc-500">
          Classic script stepper:{" "}
          <Link className="text-emerald-400 underline" href="../call">
            Script assist
          </Link>{" "}
          · Mobile API: <code className="text-zinc-400">POST /api/call-assistant/next-line</code>
        </p>
      </div>

      <aside className="space-y-4 rounded-2xl border border-white/10 bg-zinc-950/80 p-5 text-sm">
        <h3 className="font-semibold text-white">Objection chips</h3>
        <div className="flex flex-wrap gap-2">
          {["not interested", "busy", "already have leads", "send email"].map((label) => (
            <button
              key={label}
              type="button"
              className="rounded-full border border-white/15 px-2 py-1 text-[11px] text-zinc-300 hover:border-amber-800"
              onClick={() => {
                applyProspectSnippets(label, label);
                tagObjection(label);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="border-t border-white/10 pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Flow trail</h4>
          <p className="mt-2 font-mono text-[11px] leading-relaxed text-zinc-500">
            {stagesVisited.join(" → ")}
          </p>
        </div>
      </aside>
    </div>
  );
}

/** Minimal typing for Web Speech API */
interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}
