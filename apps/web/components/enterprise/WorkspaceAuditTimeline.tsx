"use client";

type LogRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: string;
  actor: { id: string; email: string | null; name: string | null };
};

export function WorkspaceAuditTimeline({ logs }: { logs: LogRow[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-slate-500">No audit events yet.</p>;
  }
  return (
    <ol className="relative space-y-4 border-l border-white/10 pl-6">
      {logs.map((log) => (
        <li key={log.id} className="relative">
          <span className="absolute -left-[9px] top-1.5 h-3 w-3 rounded-full border border-emerald-500/50 bg-emerald-500/30" />
          <div className="rounded-lg border border-white/10 bg-[#0f0f0f] p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-mono text-xs text-emerald-300/90">{log.action}</span>
              <time className="text-xs text-slate-500" dateTime={log.createdAt}>
                {new Date(log.createdAt).toLocaleString()}
              </time>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {log.actor.name || log.actor.email || log.actor.id}
              {log.entityType ? ` · ${log.entityType}` : ""}
              {log.entityId ? ` · ${log.entityId.slice(0, 8)}…` : ""}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
