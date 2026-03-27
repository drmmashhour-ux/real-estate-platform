"use client";

import { useEffect, useState } from "react";

type Channel = {
  id: string;
  platform: string;
  displayName: string;
  externalAccountId: string;
  status: string;
  tokenExpiresAt: string | null;
};

export function ConnectedChannelsPanel() {
  const [channels, setChannels] = useState<Channel[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/growth/channels")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setChannels(d.channels);
      })
      .catch(() => setError("Failed to load channels"));
  }, []);

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!channels) return <p className="text-sm text-slate-500">Loading channels…</p>;
  if (!channels.length) return <p className="text-sm text-slate-400">No OAuth channels connected yet.</p>;

  return (
    <ul className="space-y-2 text-sm text-slate-200">
      {channels.map((c) => (
        <li key={c.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
          <span className="font-medium text-white">{c.displayName}</span>{" "}
          <span className="text-slate-500">({c.platform})</span>
          <span className="ml-2 text-xs text-slate-500">status: {c.status}</span>
        </li>
      ))}
    </ul>
  );
}
