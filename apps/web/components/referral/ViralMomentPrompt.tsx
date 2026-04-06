"use client";

import Link from "next/link";
import { InviteFriendsShare, buildViralShareMessage } from "./InviteFriendsShare";

type Props = {
  headline: string;
  sub: string;
  inviteUrl: string;
  /** When true, show compact strip (e.g. after booking). */
  compact?: boolean;
};

export function ViralMomentPrompt({ headline, sub, inviteUrl, compact }: Props) {
  if (compact) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-slate-100">
        <p className="text-sm font-semibold text-emerald-200">{headline}</p>
        <p className="mt-1 text-xs text-slate-400">{sub}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/invite`}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
          >
            Get your invite link
          </Link>
          <button
            type="button"
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white"
            onClick={() => void navigator.clipboard.writeText(buildViralShareMessage(inviteUrl))}
          >
            Copy invite text
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-premium-gold/25 bg-[#0f0f0f] p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">Grow together</p>
      <h3 className="mt-2 text-lg font-bold text-white">{headline}</h3>
      <p className="mt-1 text-sm text-slate-400">{sub}</p>
      <div className="mt-4">
        <InviteFriendsShare inviteUrl={inviteUrl} />
      </div>
      <Link href="/dashboard/referrals" className="mt-3 inline-block text-sm text-premium-gold hover:underline">
        Referral dashboard →
      </Link>
    </div>
  );
}
