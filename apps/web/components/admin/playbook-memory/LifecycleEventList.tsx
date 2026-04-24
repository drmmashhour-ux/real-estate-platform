type E = { id: string; createdAt: string; eventType: string; reason: string | null; playbookVersionId: string | null };

export function LifecycleEventList({ events, title = "Recent lifecycle" }: { events: E[]; title?: string }) {
  if (!events.length) {
    return <p className="text-sm text-white/50">No events.</p>;
  }
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-[#D4AF37]">{title}</p>
      <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm text-white/70">
        {events.map((e) => (
          <li key={e.id} className="border-b border-white/5 py-1 font-mono text-xs">
            <span className="text-white/40">{e.createdAt.slice(0, 19)}</span> · {e.eventType}
            {e.reason ? <span className="text-white/50"> — {e.reason}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
