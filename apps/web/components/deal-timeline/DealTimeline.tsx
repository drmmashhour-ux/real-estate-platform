"use client";

import { useEffect, useState } from "react";
import { TimelineStep } from "./TimelineStep";

type Event = { id: string; at: string; kind: string; title: string; detail?: string };

export function DealTimeline({ dealId }: { dealId: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/deals/${dealId}/timeline`, { credentials: "include" });
        const data = (await res.json()) as { events?: Event[]; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Failed");
        setEvents(data.events ?? []);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Error");
      }
    })();
  }, [dealId]);

  if (err) return <p className="text-sm text-amber-300">{err}</p>;
  if (!events.length) return <p className="text-sm text-ds-text-secondary">No timeline events yet.</p>;

  return (
    <div className="space-y-0">
      {events.map((ev) => (
        <TimelineStep key={ev.id} title={ev.title} at={ev.at} detail={ev.detail} kind={ev.kind} />
      ))}
    </div>
  );
}
