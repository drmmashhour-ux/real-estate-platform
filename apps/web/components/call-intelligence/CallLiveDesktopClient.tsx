"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { AcquisitionContactVm } from "@/modules/acquisition/acquisition.types";
import type { CallAssistantContext, CallStage } from "@/modules/call-assistant/call-assistant.types";
import { getVariantMetadata } from "@/modules/sales-scripts/sales-script-variants.service";
import { getScriptByCategory } from "@/modules/sales-scripts/sales-script.service";
import {
  advanceStageAfterLine,
  nextDiscoveryIndex,
} from "@/modules/call-assistant/call-assistant.service";
import { analyzeTranscript } from "@/modules/call-intelligence/call-analysis.service";
import { getIntelSuggestions } from "@/modules/call-intelligence/call-ai-suggestion.service";
import type { IntelPerformanceVm } from "@/modules/call-intelligence/call-intelligence-insights.service";
import type { SpeakerLabel, TranscriptChunk } from "@/modules/call-intelligence/call-intelligence.types";
import { mergeTranscriptChunks, transcribeStream } from "@/modules/call-intelligence/call-transcription.service";
import { startManualRecording, type RecordingHandle } from "@/modules/call-intelligence/call-recording.service";
import type {
  SalesCallOutcome,
  SalesScriptCategory,
  ScriptAudience,
  ScriptContext,
} from "@/modules/sales-scripts/sales-script.types";

const OUTCOMES: SalesCallOutcome[] = ["INTERESTED", "DEMO", "CLOSED", "LOST", "NO_ANSWER"];

export function CallLiveDesktopClient({
  contacts,
  performance,
}: {
  contacts: AcquisitionContactVm[];
  performance: IntelPerformanceVm;
}) {
  const [callActive, setCallActive] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const [audience, setAudience] = useState<ScriptAudience>("BROKER");
  const [category, setCategory] = useState<SalesScriptCategory>("cold_call_broker");
  const [stage, setStage] = useState<CallStage>("opening");
  const [discoveryIndex, setDiscoveryIndex] = useState(0);
  const [contactId, setContactId] = useState("");
  const [contactName, setContactName] = useState("");
  const [region, setRegion] = useState("");
  const [performanceTier, setPerformanceTier] = useState<ScriptContext["performanceTier"]>("average");

  const [chunks, setChunks] = useState<TranscriptChunk[]>([]);
  const [interim, setInterim] = useState("");
  const [transcriptError, setTranscriptError] = useState<string | null>(null);

  const [speakerMode, setSpeakerMode] = useState<SpeakerLabel>("counterpart");
  const speakerForNextRef = useRef<SpeakerLabel>("counterpart");
  useEffect(() => {
    speakerForNextRef.current = speakerMode;
  }, [speakerMode]);

  const streamRef = useRef<MediaStream | null>(null);
  const transcriptionStopRef = useRef<(() => void) | null>(null);

  const [recordingConsentShown, setRecordingConsentShown] = useState(false);
  const recordingRef = useRef<RecordingHandle | null>(null);
  const [recordingLabel, setRecordingLabel] = useState<string | null>(null);
  const [recordingBusy, setRecordingBusy] = useState(false);

  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState<SalesCallOutcome>("INTERESTED");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const ctxScript: ScriptContext = useMemo(
    () => ({
      audience,
      contactName: contactName.trim() || undefined,
      region: region.trim() || undefined,
      performanceTier,
    }),
    [audience, contactName, region, performanceTier],
  );

  const variantKey = useMemo(() => getVariantMetadata(ctxScript), [ctxScript]);

  const assistantCtx = useMemo(
    (): CallAssistantContext => ({
      audience,
      scriptCategory: category,
      stage,
      discoveryIndex,
      scriptContext: ctxScript,
    }),
    [audience, category, stage, discoveryIndex, ctxScript],
  );

  const lastClientSentence = useMemo(() => {
    const finals = chunks.filter((c) => c.final);
    for (let i = finals.length - 1; i >= 0; i--) {
      const c = finals[i]!;
      if (c.speaker === "counterpart" || c.speaker === "unknown") {
        return c.text;
      }
    }
    const last = finals[finals.length - 1];
    return last?.text ?? "";
  }, [chunks]);

  const suggestion = useMemo(
    () =>
      getIntelSuggestions({
        lastClientSentence,
        audience,
        scriptCategory: category,
        stage,
        discoveryIndex,
        scriptContext: ctxScript,
      }),
    [lastClientSentence, audience, category, stage, discoveryIndex, ctxScript],
  );

  useEffect(() => {
    if (!callActive) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [callActive]);

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

  const stopMedia = useCallback(() => {
    transcriptionStopRef.current?.();
    transcriptionStopRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCall = useCallback(async () => {
    setTranscriptError(null);
    setChunks([]);
    setInterim("");
    setSeconds(0);
    setRecordingLabel(null);
    recordingRef.current = null;
    setRecordingBusy(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      streamRef.current = stream;
      setCallActive(true);

      const session = await transcribeStream(
        stream,
        {
          onPartial: (c) => setInterim(c.text),
          onFinal: (c) => {
            setInterim("");
            setChunks((prev) => [...prev, { ...c, final: true }]);
          },
          onError: (m) => setTranscriptError(m),
        },
        {
          language: "en-US",
          getSpeaker: () => speakerForNextRef.current,
        },
      );
      transcriptionStopRef.current = session.stop;
    } catch {
      setTranscriptError("mic_denied_or_unavailable");
      setCallActive(false);
    }
  }, []);

  const endCall = useCallback(async () => {
    setCallActive(false);
    let blob: Blob | null = null;
    const rec = recordingRef.current;
    if (rec && typeof rec.stop === "function") {
      blob = await rec.stop();
      recordingRef.current = null;
      setRecordingBusy(false);
    }
    if (blob && blob.size > 0) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lecipm-call-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      setRecordingLabel(`Local file downloaded · ${blob.size} bytes`);
    }
    stopMedia();
  }, [stopMedia]);

  async function confirmRecordingStart() {
    const stream = streamRef.current;
    if (!stream) return;
    setRecordingConsentShown(false);
    const handle = startManualRecording(stream);
    if ("error" in handle) {
      setRecordingLabel(handle.error);
      return;
    }
    recordingRef.current = handle;
    setRecordingBusy(true);
    setRecordingLabel("Recording…");
  }

  async function submitCrm() {
    setSaveStatus("saving");
    const fullText = mergeTranscriptChunks(chunks.filter((c) => c.final));
    const analysis = analyzeTranscript(fullText);
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
          objectionsEncountered: analysis.objectionsDetected,
          notes: notes.trim() || null,
          stagesVisited: [stage],
          secondsInCallApprox: seconds,
          fullTranscript: fullText.slice(0, 8000),
          intelAnalysisJson: JSON.stringify(analysis),
          pipelineAdvance: outcome === "DEMO",
        }),
      });
      if (!res.ok) throw new Error("fail");
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  const script = useMemo(() => getScriptByCategory(category, ctxScript), [category, ctxScript]);

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-zinc-950 text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
          iMac · Call intelligence
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Live call desk</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-500">
          Mic transcription and script suggestions only. You stay in control: no auto-dial, no AI voice to the prospect.
          Recording requires an explicit confirmation and saves as a local file by default — not uploaded automatically.
        </p>
        <p className="mt-3 text-xs text-zinc-500">
          Last {performance.sinceDays}d · ~{performance.callsPerDayApprox} calls/day · success ~
          {(performance.successRateApprox * 100).toFixed(1)}% · top line:{" "}
          {performance.topCategories[0]?.category?.replace(/_/g, " ") ?? "—"}
        </p>
      </header>

      <div className="grid flex-1 gap-4 p-4 lg:grid-cols-12 lg:gap-6 lg:p-6">
        {/* LEFT — transcript */}
        <section className="flex min-h-[320px] flex-col rounded-2xl border border-white/10 bg-black/40 lg:col-span-3">
          <div className="border-b border-white/10 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-200">Live transcript</h2>
            <p className="mt-1 text-[11px] text-zinc-500">
              Tag speaker for clarity. Mono mic — separation is manual/best-effort.
            </p>
          </div>
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3 font-mono text-sm leading-relaxed text-zinc-300">
            {chunks
              .filter((c) => c.final && c.text.trim())
              .map((c) => (
                <p key={c.id}>
                  <span className="text-[10px] uppercase text-zinc-600">{c.speaker} · </span>
                  {c.text}
                </p>
              ))}
            {interim ? (
              <p className="text-zinc-500 italic">
                <span className="text-[10px] uppercase text-zinc-600">interim · </span>
                {interim}
              </p>
            ) : null}
            {!callActive && chunks.length === 0 ? (
              <p className="text-xs text-zinc-600">Start the call to transcribe from your microphone.</p>
            ) : null}
            {transcriptError ? (
              <p className="text-xs text-amber-400">
                {transcriptError === "speech_recognition_unsupported"
                  ? "Speech recognition not supported in this browser."
                  : transcriptError}
              </p>
            ) : null}
          </div>
          <div className="border-t border-white/10 px-4 py-3">
            <p className="text-[11px] text-zinc-500">Tag next final line as</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs ${speakerMode === "rep" ? "bg-emerald-900 text-white" : "bg-zinc-900 text-zinc-400"}`}
                onClick={() => setSpeakerMode("rep")}
              >
                Me (rep)
              </button>
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs ${speakerMode === "counterpart" ? "bg-emerald-900 text-white" : "bg-zinc-900 text-zinc-400"}`}
                onClick={() => setSpeakerMode("counterpart")}
              >
                Them
              </button>
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs ${speakerMode === "unknown" ? "bg-emerald-900 text-white" : "bg-zinc-900 text-zinc-400"}`}
                onClick={() => setSpeakerMode("unknown")}
              >
                Unknown
              </button>
            </div>
          </div>
        </section>

        {/* CENTER — stage + suggestions */}
        <section className="flex min-h-[320px] flex-col rounded-2xl border border-emerald-900/40 bg-black/50 lg:col-span-6">
          <div className="border-b border-emerald-900/30 px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-400/90">Conversation</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="block text-xs text-zinc-400">
                Audience
                <select
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white"
                  disabled={callActive}
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
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white"
                  disabled={callActive}
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
                CRM contact
                <select
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white"
                  disabled={callActive}
                  value={contactId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setContactId(id);
                    const c = contacts.find((x) => x.id === id);
                    if (c) setContactName(c.name);
                  }}
                >
                  <option value="">— optional —</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-xs uppercase text-zinc-500">Stage</span>
              <span className="rounded-full bg-emerald-950 px-3 py-1 text-sm font-medium text-emerald-200">
                {stage}
              </span>
              <button
                type="button"
                className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-white hover:bg-zinc-700"
                onClick={() => {
                  const next = advanceStageAfterLine(stage, assistantCtx);
                  if (stage === "discovery" && next === "discovery") {
                    setDiscoveryIndex(nextDiscoveryIndex(assistantCtx));
                  } else if (next === "discovery") setDiscoveryIndex(0);
                  setStage(next);
                }}
              >
                Advance stage
              </button>
            </div>
          </div>
          <div className="flex flex-1 flex-col px-6 py-8">
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">Suggested reply</p>
            <p className="mt-4 text-3xl font-medium leading-snug tracking-tight text-white md:text-4xl">
              {suggestion.suggested}
            </p>
            {suggestion.objectionLabel ? (
              <p className="mt-4 text-sm text-amber-200/90">Objection hint: {suggestion.objectionLabel}</p>
            ) : null}
            <div className="mt-8 space-y-3">
              <p className="text-[11px] uppercase text-zinc-500">Alternatives</p>
              {suggestion.alternatives
                .filter(Boolean)
                .slice(0, 3)
                .map((line, i) => (
                  <p key={i} className="rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3 text-lg text-zinc-200">
                    {line}
                  </p>
                ))}
            </div>
            <p className="mt-8 text-xs text-zinc-600">
              Variant <span className="font-mono text-zinc-400">{variantKey}</span> · Compliance:{" "}
              {script.rep_reminder ?? "Stay factual."}
            </p>
          </div>
        </section>

        {/* RIGHT — quick buttons */}
        <section className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-950/80 p-4 lg:col-span-3">
          <h2 className="text-sm font-semibold text-white">Quick actions</h2>
          <button
            type="button"
            className="rounded-xl border border-white/15 bg-zinc-900 px-4 py-3 text-left text-sm text-zinc-200 hover:border-amber-800"
            onClick={() => {
              setSpeakerMode("counterpart");
              speakerForNextRef.current = "counterpart";
              setChunks((prev) => [
                ...prev,
                {
                  id: `inj-${Date.now()}`,
                  atMs: Date.now(),
                  text: "I'm not interested",
                  speaker: "counterpart",
                  final: true,
                },
              ]);
            }}
          >
            Objection: not interested
          </button>
          <button
            type="button"
            className="rounded-xl border border-white/15 bg-zinc-900 px-4 py-3 text-left text-sm text-zinc-200 hover:border-amber-800"
            onClick={() => {
              setSpeakerMode("counterpart");
              speakerForNextRef.current = "counterpart";
              setChunks((prev) => [
                ...prev,
                {
                  id: `inj-${Date.now()}`,
                  atMs: Date.now(),
                  text: "I'm busy right now",
                  speaker: "counterpart",
                  final: true,
                },
              ]);
            }}
          >
            Objection: busy
          </button>
          <button
            type="button"
            className="rounded-xl border border-emerald-900/40 bg-emerald-950/40 px-4 py-3 text-left text-sm text-emerald-100 hover:bg-emerald-950/70"
            onClick={() => {
              setStage("closing");
              setOutcome("DEMO");
              setNotes((n) => (n.trim() ? n : "Demo requested — book slot."));
            }}
          >
            Close → demo
          </button>
          <button
            type="button"
            className="rounded-xl border border-white/15 bg-zinc-900 px-4 py-3 text-left text-sm text-zinc-200 hover:border-white/25"
            onClick={() => setNotes((n) => `${n}\n${new Date().toISOString()} — `.trim())}
          >
            Add note (timestamp)
          </button>
        </section>
      </div>

      {/* BOTTOM bar */}
      <footer className="sticky bottom-0 z-10 border-t border-white/10 bg-zinc-950/95 px-4 py-4 backdrop-blur lg:px-8">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 font-mono text-sm">
            <span className="text-zinc-500">
              Timer <span className="text-xl text-white">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>
            </span>
            {!callActive ? (
              <button
                type="button"
                onClick={() => void startCall()}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-black hover:bg-emerald-500"
              >
                Start call (mic)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void endCall()}
                className="rounded-xl border border-white/20 px-5 py-2.5 text-sm text-white hover:bg-white/10"
              >
                End call
              </button>
            )}
            <button
              type="button"
              disabled={!callActive || recordingBusy}
              onClick={() => setRecordingConsentShown(true)}
              className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-500 disabled:opacity-40"
            >
              Record…
            </button>
            {recordingLabel ? <span className="text-xs text-zinc-400">{recordingLabel}</span> : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs text-zinc-500">
              Outcome
              <select
                className="ml-2 rounded-lg border border-white/10 bg-black/60 px-2 py-2 text-sm text-white"
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
            <textarea
              className="min-h-[44px] w-[min(100%,280px)] rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
              placeholder="Notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button
              type="button"
              disabled={saveStatus === "saving"}
              onClick={() => void submitCrm()}
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200"
            >
              {saveStatus === "saving" ? "Saving…" : "Save to CRM"}
            </button>
            {saveStatus === "saved" ? <span className="text-xs text-emerald-400">Saved.</span> : null}
            {saveStatus === "error" ? <span className="text-xs text-red-400">Error.</span> : null}
          </div>
        </div>
      </footer>

      {recordingConsentShown ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="max-w-md rounded-2xl border border-white/15 bg-zinc-950 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Start recording?</h3>
            <p className="mt-3 text-sm text-zinc-400">
              Recording captures audio from your active microphone stream. A file is offered for download when you end
              the call — it is not uploaded automatically. Ensure you comply with local recording laws and customer
              consent.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-white"
                onClick={() => setRecordingConsentShown(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-500"
                onClick={() => void confirmRecordingStart()}
              >
                I confirm — start recording
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
