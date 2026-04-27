"use client";

import { useCallback, useState } from "react";
import { getReferralReward } from "@/lib/growth/referralReward";

export function ReferralViralCard({
  inviteLink,
  referralCount,
}: {
  inviteLink: string;
  /** Typically referral signups (see `getReferralAnalytics` signups). */
  referralCount: number;
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(() => {
    if (!inviteLink) return;
    void navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }, [inviteLink]);
  const reward = getReferralReward(referralCount);

  return (
    <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/30 p-3 text-slate-100 shadow-sm backdrop-blur">
      {reward ? <p className="text-xs text-emerald-200/90">{reward}</p> : null}
      <p className="text-sm">Invite friends and unlock better deals 👇</p>
      <button
        type="button"
        onClick={onCopy}
        className="mt-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
      >
        {copied ? "Copied!" : "Copy invite link"}
      </button>
    </div>
  );
}
