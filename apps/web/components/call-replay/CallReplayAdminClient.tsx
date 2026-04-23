"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { analyzeCallReplay } from "@/modules/call-replay/call-replay-analysis.service";
import { addCoachCommentReplay } from "@/modules/call-replay/call-replay-coach.service";
import {
  aggregateCommonTags,
  buildReplayPerformanceHistory,
  improvementTrendReplay,
} from "@/modules/call-replay/call-replay-history.service";
import { psychologyFromReplayTranscript, trainingModuleLinkForReplay } from "@/modules/call-replay/call-replay-integration.service";
import { rewriteMoment } from "@/modules/call-replay/call-replay-rewrite.service";
import {
  createRecording,
  deleteRecording,
  getRecording,
  listRecordings,
  loadAudioForRecording,
  parseTranscriptPaste,
  saveAudioForRecording,
  updateRecording,
} from "@/modules/call-replay/call-storage.service";
import type { MomentTag, TranscriptSegment } from "@/modules/call-replay/call-replay.types";

const TAGS: { value: MomentTag; label: string; emoji: string }[] = [
  { value: "mistake", label: "Mistake", emoji: "🔴" },
  { value: "improvement", label: "Improvement", emoji: "🟡" },
  { value: "strong", label: "Strong", emoji: "🟢" },
];

function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function CallReplayAdminClient({
  dashBase,
  adminBase,
}: {
  dashBase: string;
  adminBase: string;
}) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((x) => x + 1), []);
  void tick;
  const recordings = listRecordings();
  const history = buildReplayPerformanceHistory();
  const trend = improvementTrendReplay();
  const tagAgg = aggregateCommonTags();

  const [selectedId, setSelectedId] = useState<string>("");
  const [currentSec, setCurrentSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [titleDraft, setTitleDraft] = useState("");
  const [transcriptRaw, setTranscriptRaw] = useState("");
  const [consent, setConsent] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [activeSegId, setActiveSegId] = useState<string | null>(null);
  const [rewriteSegId, setRewriteSegId] = useState<string | null>(null);
  const [rewriteHint, setRewriteHint] = useState<"shorter" | "empathy" | "close" | "">("");
  const [coachBody, setCoachBody] = useState("");
  const [peekSegmentId, setPeekSegmentId] = useState<string | null>(null);

  const activeRecordingId = selectedId || recordings[0]?.recordingId || "";
  void tick;
  const selected = activeRecordingId ? getRecording(activeRecordingId) : undefined;
  const analysis = selected ? analyzeCallReplay(selected.transcript) : null;
  const psychology = selected ? psychologyFromReplayTranscript(selected.transcript) : null;

  let audioSrc: string | null = null;
  if (activeRecordingId) {
    const blob = loadAudioForRecording(activeRecordingId);
    if (blob) audioSrc = `data:${blob.mimeType};base64,${blob.data}`;
  }

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !selected) return;
    const onTime = () => {
      const t = a.currentTime;
      setCurrentSec(t);
      const seg = selected.transcript.find((s) => t >= s.startSec && t < s.endSec);
      setActiveSegId(seg?.id ?? null);
    };
    a.addEventListener("timeupdate", onTime);
    return () => a.removeEventListener("timeupdate", onTime);
  }, [selected]);

  function seekTo(sec: number) {
    const a = audioRef.current;
    if (a) {
      a.currentTime = sec;
      a.play().catch(() => {});
    }
    setCurrentSec(sec);
  }

  async function handleImport() {
    if (!consent || !transcriptRaw.trim()) return;
    const transcript = parseTranscriptPaste(transcriptRaw);
    const rec = createRecording({
      title: titleDraft.trim() || "Imported call",
      transcript,
      metadata: {
        consentAcknowledged: true,
        notes: "User-imported transcript / optional audio.",
      },
      durationSec: transcript.length ? transcript[transcript.length - 1]!.endSec : undefined,
    });
    if (audioFile) {
      const buf = await audioFile.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]!);
      const b64 = btoa(binary);
      const res = saveAudioForRecording(rec.recordingId, b64, audioFile.type || "audio/webm");
      if (!res.ok) console.warn(res.error);
    }
    setSelectedId(rec.recordingId);
    setTitleDraft("");
    setTranscriptRaw("");
    setAudioFile(null);
    setConsent(false);
    refresh();
  }

  function setSegmentTag(segId: string, tag: MomentTag | "") {
    if (!activeRecordingId) return;
    const r = getRecording(activeRecordingId);
    if (!r) return;
    const next = { ...(r.segmentTags ?? {}) };
    if (!tag) delete next[segId];
    else next[segId] = tag;
    updateRecording(activeRecordingId, { segmentTags: next });
    refresh();
  }

  function handleDelete(id: string) {
    deleteRecording(id);
    if (selectedId === id || activeRecordingId === id) setSelectedId("");
    refresh();
  }

  let rewriteResult: ReturnType<typeof rewriteMoment> | null = null;
  if (rewriteSegId && activeRecordingId) {
    const r = getRecording(activeRecordingId);
    if (r) rewriteResult = rewriteMoment(rewriteSegId, r.transcript, rewriteHint || undefined);
  }

  const trainingHref = trainingModuleLinkForReplay(true, `${adminBase}/team-training`);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 text-zinc-100">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-zinc-500">LECIPM · Coaching</p>
        <h1 className="text-2xl font-semibold tracking-tight">Call replay analyzer</h1>
        <p className="max-w-3xl text-sm text-zinc-400">
          Upload or paste materials you already have permission to use.{" "}
          <strong className="font-medium text-zinc-200">This workspace never starts or records calls for you.</strong>{" "}
          Clear consent before saving.
        </p>
      </header>

      <section className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4 text-sm text-amber-100/90">
        <p className="font-medium text-amber-200">Compliance & transparency</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-amber-100/80">
          <li>No automatic recording — you bring your own file or transcript.</li>
          <li>Audio may be stored only in this browser session (size limits apply).</li>
          <li>Use for coaching only; follow your org&apos;s recording and privacy policies.</li>
        </ul>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
            <h2 className="text-lg font-medium text-zinc-100">Import a call</h2>
            <div className="mt-4 space-y-3">
              <label className="block text-sm text-zinc-400">
                Title
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  placeholder="e.g. Discovery — Acme follow-up"
                />
              </label>
              <label className="block text-sm text-zinc-400">
                Transcript (paste). Lines like <code className="text-amber-200/90">Rep:</code> /{" "}
                <code className="text-amber-200/90">Prospect:</code> or <code className="text-amber-200/90">[0:15]</code> timestamps.
                <textarea
                  className="mt-1 min-h-[140px] w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100"
                  value={transcriptRaw}
                  onChange={(e) => setTranscriptRaw(e.target.value)}
                />
              </label>
              <label className="block text-sm text-zinc-400">
                Optional audio (your file)
                <input
                  type="file"
                  accept="audio/*"
                  className="mt-1 block w-full text-sm text-zinc-400 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-zinc-200"
                  onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                I confirm I have the right to use this recording/transcript for coaching here.
              </label>
              <button
                type="button"
                disabled={!consent || !transcriptRaw.trim()}
                onClick={() => void handleImport()}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-40"
              >
                Save to replay library
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
            <h2 className="text-lg font-medium">Saved calls</h2>
            <ul className="mt-3 divide-y divide-zinc-800">
              {recordings.length === 0 ?
                <li className="py-3 text-sm text-zinc-500">No calls yet — import above.</li>
              : recordings.map((r) => (
                  <li key={r.recordingId} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedId(r.recordingId)}
                      className={`text-left text-sm ${activeRecordingId === r.recordingId ? "text-amber-300" : "text-zinc-200"}`}
                    >
                      {r.title}
                      <span className="ml-2 text-xs text-zinc-500">{new Date(r.createdAtIso).toLocaleString()}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(r.recordingId)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </li>
                ))
              }
            </ul>
          </section>

          {selected ?
            <>
              <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-medium">{selected.title}</h2>
                    <p className="mt-1 text-xs text-zinc-500">
                      {selected.metadata.consentAcknowledged ? "Consent recorded." : "Missing consent flag."}
                      {selected.audioStored ? " Audio in session." : " No audio stored."}
                    </p>
                  </div>
                  {audioSrc ?
                    <audio
                      ref={audioRef}
                      controls
                      className="w-full max-w-md"
                      src={audioSrc}
                      onLoadedMetadata={(e) => setDurationSec(e.currentTarget.duration || 0)}
                    />
                  : <p className="text-sm text-zinc-500">No audio for this entry — transcript-only replay.</p>}
                </div>

                {durationSec > 0 && analysis ?
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Timeline</p>
                    <div
                      className="relative h-8 w-full cursor-pointer rounded-md bg-zinc-900"
                      onClick={(ev) => {
                        const rect = ev.currentTarget.getBoundingClientRect();
                        const x = ev.clientX - rect.left;
                        const ratio = x / rect.width;
                        seekTo(ratio * durationSec);
                      }}
                      role="slider"
                      aria-label="Seek along call"
                      aria-valuemin={0}
                      aria-valuemax={Math.max(0, Math.ceil(durationSec))}
                      aria-valuenow={Math.min(Math.ceil(currentSec), Math.ceil(durationSec))}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowRight") seekTo(currentSec + 5);
                        if (e.key === "ArrowLeft") seekTo(Math.max(0, currentSec - 5));
                      }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 rounded-md bg-amber-900/40"
                        style={{ width: `${durationSec ? (currentSec / durationSec) * 100 : 0}%` }}
                      />
                      {analysis.events.map((ev, i) => (
                        <button
                          key={`${ev.kind}-${i}`}
                          type="button"
                          title={ev.message}
                          className="absolute top-1 h-6 w-1 -translate-x-1/2 rounded bg-amber-400/90 hover:bg-amber-300"
                          style={{
                            left: `${durationSec ? (ev.startSec / durationSec) * 100 : 0}%`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            seekTo(ev.startSec);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                : null}
              </section>

              <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
                <h2 className="text-lg font-medium">Transcript</h2>
                <ul className="mt-4 space-y-2">
                  {selected.transcript.map((seg: TranscriptSegment) => {
                    const isActive = seg.id === activeSegId;
                    const tag = selected.segmentTags?.[seg.id];
                    return (
                      <li key={seg.id}>
                        <button
                          type="button"
                          onClick={() => seekTo(seg.startSec)}
                          className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                            isActive ? "border-amber-600/60 bg-amber-950/30" : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-600"
                          }`}
                        >
                          <span className="text-xs text-zinc-500">
                            {formatTime(seg.startSec)} · {seg.speaker}
                          </span>
                          <p className="mt-1 text-zinc-200">{seg.text}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="text-xs text-zinc-500">Tag:</span>
                            {TAGS.map((t) => (
                              <button
                                key={t.value}
                                type="button"
                                className={`rounded px-2 py-0.5 text-xs ${
                                  tag === t.value ? "bg-zinc-700 text-zinc-100" : "bg-zinc-800/80 text-zinc-400"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSegmentTag(seg.id, tag === t.value ? "" : t.value);
                                }}
                              >
                                {t.emoji} {t.label}
                              </button>
                            ))}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
                <h2 className="text-lg font-medium">Rewrite moment</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Pick a rep line — get a coached alternative (not sent to prospects).
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <select
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                    value={rewriteSegId ?? ""}
                    onChange={(e) => setRewriteSegId(e.target.value || null)}
                  >
                    <option value="">Select segment…</option>
                    {selected.transcript
                      .filter((s) => s.speaker === "rep")
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {formatTime(s.startSec)} — {s.text.slice(0, 72)}
                          {s.text.length > 72 ? "…" : ""}
                        </option>
                      ))}
                  </select>
                  <select
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                    value={rewriteHint}
                    onChange={(e) => setRewriteHint((e.target.value || "") as typeof rewriteHint)}
                  >
                    <option value="">Default coaching</option>
                    <option value="shorter">Shorter</option>
                    <option value="empathy">Empathy first</option>
                    <option value="close">Strong close</option>
                  </select>
                </div>
                {rewriteResult ?
                  <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 text-sm">
                    <p className="text-zinc-300">{rewriteResult.improved}</p>
                    <p className="mt-2 text-xs text-zinc-500">{rewriteResult.rationale}</p>
                  </div>
                : null}
              </section>

              <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
                <h2 className="text-lg font-medium">Coach review</h2>
                <textarea
                  className="mt-3 min-h-[88px] w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  placeholder="Comments for the rep…"
                  value={coachBody}
                  onChange={(e) => setCoachBody(e.target.value)}
                />
                <button
                  type="button"
                  className="mt-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900"
                  onClick={() => {
                    if (!coachBody.trim() || !activeRecordingId) return;
                    addCoachCommentReplay({ recordingId: activeRecordingId, body: coachBody });
                    setCoachBody("");
                    refresh();
                  }}
                >
                  Add comment
                </button>
                <ul className="mt-4 space-y-2 text-sm">
                  {(selected.coachComments ?? []).map((c) => (
                    <li key={c.commentId} className="rounded border border-zinc-800 bg-zinc-900/40 px-3 py-2">
                      <span className="text-xs text-zinc-500">{new Date(c.createdAtIso).toLocaleString()}</span>
                      <p className="mt-1 text-zinc-200">{c.body}</p>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          : null}
        </div>

        <aside className="space-y-6">
          {analysis && selected ?
            <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
              <h2 className="text-lg font-medium">AI-style analysis</h2>
              <p className="mt-2 text-3xl font-semibold text-amber-300">{analysis.overallScore}</p>
              <p className="text-xs text-zinc-500">Score (heuristic, explainable rules — not a black box).</p>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="font-medium text-emerald-400/90">Strengths</p>
                  <ul className="mt-1 list-inside list-disc text-zinc-400">
                    {analysis.strengths.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-rose-400/90">Mistakes</p>
                  <ul className="mt-1 list-inside list-disc text-zinc-400">
                    {analysis.mistakes.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-amber-400/90">Missed opportunities</p>
                  <ul className="mt-1 list-inside list-disc text-zinc-400">
                    {analysis.missedOpportunities.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-zinc-300">Better responses</p>
                  <ul className="mt-2 space-y-2">
                    {analysis.betterResponses.map((b) => (
                      <li key={b.segmentId} className="rounded border border-zinc-800 bg-zinc-900/50 p-2 text-xs text-zinc-300">
                        <span className="text-zinc-500">Segment {b.segmentId.slice(0, 8)}…</span>
                        <p className="mt-1">{b.suggestion}</p>
                        <button
                          type="button"
                          className="mt-1 text-amber-400/90 hover:text-amber-300"
                          onClick={() =>
                            setPeekSegmentId((id) => (id === b.segmentId ? null : b.segmentId))
                          }
                        >
                          {peekSegmentId === b.segmentId ? "Hide original" : "Show original"}
                        </button>
                        {peekSegmentId === b.segmentId ?
                          <p className="mt-2 whitespace-pre-wrap text-zinc-500">
                            {selected.transcript.find((x) => x.id === b.segmentId)?.text ?? ""}
                          </p>
                        : null}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          : null}

          {psychology ?
            <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 text-sm">
              <h2 className="text-lg font-medium">Psychology overlay</h2>
              <p className="mt-2 text-zinc-400">
                Primary state: <span className="text-zinc-200">{psychology.primaryState}</span>
              </p>
              <p className="mt-1 text-zinc-400">
                Stage signal: <span className="text-zinc-200">{psychology.stage}</span>
              </p>
            </section>
          : null}

          <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 text-sm">
            <h2 className="text-lg font-medium">Performance history</h2>
            <p className="mt-2 text-zinc-400">
              Trend:{" "}
              {trend.improving ?
                <span className="text-emerald-400">Up Δ{trend.delta}</span>
              : <span className="text-zinc-500">Need more calls (or flat)</span>}
            </p>
            <ul className="mt-3 max-h-48 space-y-2 overflow-auto text-xs">
              {history.map((h) => (
                <li key={h.recordingId} className="flex justify-between gap-2 text-zinc-400">
                  <span className="truncate">{h.title}</span>
                  <span className="text-amber-300">{h.overallScore}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-zinc-500">Common tags: {JSON.stringify(tagAgg)}</p>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 text-sm">
            <h2 className="text-lg font-medium">Integrations</h2>
            <ul className="mt-3 space-y-2 text-zinc-400">
              <li>
                <Link href={dashBase} className="text-amber-400 hover:text-amber-300">
                  Dashboard home →
                </Link>
              </li>
              <li>
                <Link href={trainingHref} className="text-amber-400 hover:text-amber-300">
                  Team training lab →
                </Link>
              </li>
              <li>
                <Link href={`${adminBase.replace(/\/$/, "")}/call-center`} className="text-amber-400 hover:text-amber-300">
                  Call assistant hub →
                </Link>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
