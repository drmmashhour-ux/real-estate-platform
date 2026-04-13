"use client";

import { useMemo, useState } from "react";

type SafeAccount = {
  id: string;
  platform: string;
  accountName: string | null;
  accountId: string | null;
  expiresAt: string | null;
  lastSyncAt: string | null;
  tokenValid: boolean | null;
  metadataJson: Record<string, unknown>;
};

export function SocialConnectionsClient({
  initialAccounts,
  searchParams,
}: {
  initialAccounts: SafeAccount[];
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const banner = useMemo(() => {
    const err = typeof searchParams.error === "string" ? searchParams.error : null;
    const ok = typeof searchParams.connected === "string" ? searchParams.connected : null;
    if (err) return { type: "error" as const, text: err };
    if (ok) return { type: "ok" as const, text: `Connected: ${ok}` };
    return null;
  }, [searchParams]);

  async function refresh() {
    const res = await fetch("/api/social/accounts");
    const data = (await res.json()) as { accounts?: SafeAccount[] };
    if (res.ok && Array.isArray(data.accounts)) setAccounts(data.accounts);
  }

  async function startConnect(provider: "meta" | "buffer" | "metricool") {
    setBusy(provider);
    setMsg(null);
    try {
      const res = await fetch("/api/social/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = (await res.json()) as { url?: string; instructions?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (provider === "metricool" && data.instructions) {
        setMsg(data.instructions);
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {banner ? (
        <p
          className={`rounded-lg border px-3 py-2 text-sm ${
            banner.type === "error"
              ? "border-red-900/60 bg-red-950/50 text-red-200"
              : "border-emerald-900/60 bg-emerald-950/40 text-emerald-200"
          }`}
        >
          {banner.text}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void startConnect("meta")}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {busy === "meta" ? "Redirecting…" : "Connect Instagram / Facebook (Meta)"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void startConnect("buffer")}
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
        >
          {busy === "buffer" ? "Redirecting…" : "Connect Buffer"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void startConnect("metricool")}
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
        >
          Metricool (instructions)
        </button>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-900"
        >
          Refresh list
        </button>
      </div>

      {msg ? <p className="text-sm text-zinc-400">{msg}</p> : null}

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Token</th>
              <th className="px-4 py-3">Last sync</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-zinc-500">
                  No connections yet.
                </td>
              </tr>
            ) : (
              accounts.map((a) => (
                <tr key={a.id} className="border-b border-zinc-800/80">
                  <td className="px-4 py-3 font-mono text-xs text-amber-200/90">{a.platform}</td>
                  <td className="px-4 py-3 text-zinc-300">
                    {a.accountName ?? "—"}{" "}
                    <span className="text-xs text-zinc-600">{a.accountId ? `· ${a.accountId}` : ""}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {a.tokenValid === null
                      ? "unknown"
                      : a.tokenValid
                        ? "valid (by expiry)"
                        : "expiring / check Meta"}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {a.lastSyncAt ? new Date(a.lastSyncAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-600">
        OAuth redirect URIs must match Meta / Buffer app settings: <code className="text-zinc-500">/api/social/meta/callback</code>,{" "}
        <code className="text-zinc-500">/api/social/buffer/callback</code>.
      </p>
    </div>
  );
}
