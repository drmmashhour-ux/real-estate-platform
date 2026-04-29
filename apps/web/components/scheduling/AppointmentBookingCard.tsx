"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AppointmentType, MeetingMode } from "@/types/scheduling-client";
import { SchedulingDemoDisclaimer, SchedulingLegalCopy } from "@/components/scheduling/SchedulingStagingCopy";

type Slot = { start: string; end: string };

export function AppointmentBookingCard({
  brokerId,
  listingId,
  offerId,
  contractId,
  brokerClientId,
  defaultType = "PROPERTY_VISIT",
  titleHint,
}: {
  brokerId: string;
  listingId?: string;
  offerId?: string;
  contractId?: string;
  brokerClientId?: string;
  defaultType?: AppointmentType;
  titleHint?: string;
}) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState(30);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pick, setPick] = useState<Slot | null>(null);
  const [meetingMode, setMeetingMode] = useState<MeetingMode>("IN_PERSON");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setLoading(true);
    setErr(null);
    const q = new URLSearchParams({ date, duration: String(duration) });
    if (listingId) q.set("listingId", listingId);
    void fetch(`/api/brokers/${encodeURIComponent(brokerId)}/available-slots?${q}`, {
      credentials: "same-origin",
    })
      .then((r) => r.json())
      .then((j: { ok?: boolean; slots?: Slot[]; error?: string }) => {
        setLoading(false);
        if (!j.ok) {
          setErr(j.error ?? "Could not load slots");
          setSlots([]);
          return;
        }
        setSlots(j.slots ?? []);
        setPick(null);
      })
      .catch(() => {
        setLoading(false);
        setErr("Network error");
        setSlots([]);
      });
  }, [brokerId, date, duration, listingId]);

  async function submit() {
    if (!pick) return;
    setSubmitting(true);
    setErr(null);
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        brokerId,
        startsAt: pick.start,
        endsAt: pick.end,
        type: defaultType,
        title: titleHint ?? undefined,
        description: note || undefined,
        listingId,
        offerId,
        contractId,
        brokerClientId,
        meetingMode,
      }),
    });
    const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    setSubmitting(false);
    if (res.status === 401) {
      setErr("Please sign in to book.");
      return;
    }
    if (!j.ok) {
      setErr(j.error ?? "Could not book");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
        Request sent. The broker will confirm based on availability.
        <Link href="/dashboard/appointments" className="ml-2 underline">
          View my appointments
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-black/30 p-4 text-slate-100">
      <SchedulingDemoDisclaimer />
      <SchedulingLegalCopy />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-slate-400">
          Date
          <input
            type="date"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="text-xs text-slate-400">
          Duration (min)
          <select
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value, 10))}
          >
            <option value={30}>30</option>
            <option value={45}>45</option>
            <option value={60}>60</option>
          </select>
        </label>
      </div>
      <label className="text-xs text-slate-400">
        Mode
        <select
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          value={meetingMode}
          onChange={(e) => setMeetingMode(e.target.value as MeetingMode)}
        >
          <option value="IN_PERSON">In person</option>
          <option value="PHONE">Phone</option>
          <option value="VIDEO">Video</option>
        </select>
      </label>
      <label className="text-xs text-slate-400">
        Note (optional)
        <textarea
          className="mt-1 min-h-[60px] w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={2000}
        />
      </label>

      {loading ? <p className="text-sm text-slate-500">Loading slots…</p> : null}
      {err ? <p className="text-sm text-red-300">{err}</p> : null}

      {!loading && slots.length === 0 && !err ? (
        <p className="text-sm text-slate-500">No open slots this day. Try another date.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {slots.map((s) => (
            <button
              key={s.start}
              type="button"
              onClick={() => setPick(s)}
              className={`rounded-lg border px-3 py-1.5 text-xs ${
                pick?.start === s.start
                  ? "border-emerald-500 bg-emerald-500/20 text-white"
                  : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
            >
              {new Date(s.start).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!pick || submitting}
          onClick={submit}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Request appointment"}
        </button>
        <Link href="/auth/login" className="self-center text-xs text-slate-400 hover:text-white">
          Sign in required
        </Link>
      </div>
    </div>
  );
}
