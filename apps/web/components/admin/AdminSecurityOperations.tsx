"use client";

import { useState, useTransition } from "react";

type Pe = {
  id: string;
  eventType: string;
  sourceModule: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
};

export function AdminSecurityOperations() {
  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("manual_block");
  const [hours, setHours] = useState(168);
  const [userId, setUserId] = useState("");
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState<Pe[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run(fn: () => Promise<void>) {
    setMsg(null);
    start(() => {
      void fn().catch((e: unknown) => setMsg(e instanceof Error ? e.message : "Request failed"));
    });
  }

  return (
    <div className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Response tools</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Blocks apply to fingerprinted IPs on auth and public rate-limited routes. Force logout revokes DB sessions.
        </p>
      </div>

      {msg ? (
        <p className="rounded-lg border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-sm text-amber-100">{msg}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-300">Block IP or fingerprint</p>
          <input
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100"
            placeholder="IP address or 24-char fingerprint"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            placeholder="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <label className="flex items-center gap-2 text-xs text-zinc-500">
            Duration (hours)
            <input
              type="number"
              min={1}
              max={8760}
              className="w-24 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-zinc-200"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value) || 168)}
            />
          </label>
          <button
            type="button"
            disabled={pending || !ip.trim()}
            className="rounded-lg bg-red-900/50 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-900/70 disabled:opacity-50"
            onClick={() =>
              run(async () => {
                const res = await fetch("/api/admin/security/ip-blocks", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ip: ip.trim(), reason: reason.trim(), hours }),
                });
                const j = (await res.json()) as { error?: string };
                if (!res.ok) throw new Error(j.error ?? "Block failed");
                setMsg("IP blocked.");
                setIp("");
              })
            }
          >
            Block
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-300">Force logout (user id)</p>
          <input
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100"
            placeholder="User UUID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <button
            type="button"
            disabled={pending || !userId.trim()}
            className="rounded-lg bg-amber-900/40 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-900/60 disabled:opacity-50"
            onClick={() =>
              run(async () => {
                const res = await fetch("/api/admin/security/revoke-sessions", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId: userId.trim() }),
                });
                const j = (await res.json()) as { error?: string; sessionsRevoked?: number };
                if (!res.ok) throw new Error(j.error ?? "Revoke failed");
                setMsg(`Revoked ${j.sessionsRevoked ?? 0} session(s).`);
              })
            }
          >
            Revoke all sessions
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-black/20 p-3">
        <p className="text-sm font-medium text-zinc-300">Temporary feature disable / maintenance</p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Kill switches are server env vars (Vercel → Production). Examples:{" "}
          <code className="text-zinc-400">PLATFORM_DISABLE_PUBLIC_SIGNUP=1</code>,{" "}
          <code className="text-zinc-400">PLATFORM_DISABLE_PUBLIC_CONTACT_FORMS=1</code>,{" "}
          <code className="text-zinc-400">PLATFORM_MAINTENANCE_MESSAGE=…</code>. Redeploy or save env to apply.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-zinc-300">Search event log</p>
        <div className="flex flex-wrap gap-2">
          <input
            className="min-w-[200px] flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            placeholder="Filter (event type, module, entity id)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            disabled={pending}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
            onClick={() =>
              run(async () => {
                const qs = new URLSearchParams();
                if (query.trim()) qs.set("q", query.trim());
                qs.set("limit", "50");
                const res = await fetch(`/api/admin/security/events?${qs.toString()}`);
                const j = (await res.json()) as { events?: Pe[]; error?: string };
                if (!res.ok) throw new Error(j.error ?? "Search failed");
                setEvents(j.events ?? []);
                setMsg(`Loaded ${j.events?.length ?? 0} rows.`);
              })
            }
          >
            Search
          </button>
        </div>
        {events.length > 0 ? (
          <div className="max-h-64 overflow-auto rounded-lg border border-zinc-800 font-mono text-[11px] text-zinc-400">
            <table className="min-w-full text-left">
              <thead className="sticky top-0 bg-zinc-900 text-zinc-500">
                <tr>
                  <th className="px-2 py-1">Time</th>
                  <th className="px-2 py-1">Event</th>
                  <th className="px-2 py-1">Entity</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-t border-zinc-800/80">
                    <td className="whitespace-nowrap px-2 py-1 text-zinc-500">{e.createdAt}</td>
                    <td className="px-2 py-1 text-emerald-400/90">{e.eventType}</td>
                    <td className="max-w-[180px] truncate px-2 py-1">{e.entityId ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
