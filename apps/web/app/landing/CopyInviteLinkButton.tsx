"use client";

import { useCallback, useEffect, useState } from "react";
import { getReferralMessage } from "@/lib/growth/referral-message";

/**
 * Resolves the public invite URL in the browser and copies it to the clipboard.
 */
export function CopyInviteLinkButton() {
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setLink(`${window.location.origin}/landing`);
  }, []);

  const onCopy = useCallback(() => {
    if (!link) return;
    void navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }, [link]);

  if (!link) {
    return null;
  }

  return (
    <div className="mt-10 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Share the platform and grow the early community</p>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">{getReferralMessage(link)}</p>
      <button
        type="button"
        onClick={onCopy}
        className="mt-3 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        {copied ? "Copied!" : "Copy invite link"}
      </button>
    </div>
  );
}
