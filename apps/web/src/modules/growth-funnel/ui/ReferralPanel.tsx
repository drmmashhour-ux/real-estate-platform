"use client";

import { useEffect, useState } from "react";

export function ReferralPanel() {
  const [data, setData] = useState<{ referralUrl: string; shareMessage: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/growth-funnel/referral")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setErr(d.error);
        else setData({ referralUrl: d.referralUrl, shareMessage: d.shareMessage });
      })
      .catch(() => setErr("Could not load referral"));
  }, []);

  if (err) return <p className="text-sm text-red-400">{err}</p>;
  if (!data) return <p className="text-sm text-slate-500">Loading referral…</p>;

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-slate-200">
      <h3 className="font-semibold text-white">Invite another user</h3>
      <p className="mt-1 text-xs text-slate-500">Share your link — rewards follow your referral program rules.</p>
      {data.referralUrl ? (
        <>
          <p className="mt-3 break-all rounded border border-white/10 bg-black/40 p-2 text-xs text-slate-300">
            {data.referralUrl}
          </p>
          <button
            type="button"
            className="mt-2 text-xs font-medium text-emerald-400 hover:text-emerald-300"
            onClick={() => navigator.clipboard.writeText(data.shareMessage)}
          >
            Copy invite message
          </button>
        </>
      ) : (
        <p className="mt-2 text-xs text-slate-500">{data.shareMessage}</p>
      )}
    </div>
  );
}
