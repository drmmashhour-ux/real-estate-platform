"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  startHref: string;
  stopHref: string;
  /** Initial running state; refresh via router after actions */
  canStop: boolean;
  canStart: boolean;
  disabled: boolean;
};

export function LaunchControlClient({ startHref, stopHref, canStop, canStart, disabled }: Props) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const post = (url: string) => {
    setErr(null);
    startTransition(async () => {
      const res = await fetch(url, { method: "POST", credentials: "include" });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        code?: string;
        reasons?: string[];
      };
      if (!res.ok) {
        const baseMsg = j.error ?? j.message ?? `Error ${res.status}`;
        const withReasons =
          j.code === "not_ready" && j.reasons?.length
            ? `${baseMsg}\n${j.reasons.map((r) => `· ${r}`).join("\n")}`
            : baseMsg;
        setErr(withReasons);
        return;
      }
      router.refresh();
    });
  };

  if (disabled) {
    return (
      <p className="text-sm text-amber-200/80">
        Set <code className="font-mono">FEATURE_AI_AGENT=1</code> to use launch control.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {err ? <p className="w-full text-sm text-rose-300">{err}</p> : null}
      {canStart ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => post(startHref)}
          className="rounded-lg border border-[#D4AF37] bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-50"
        >
          Start launch
        </button>
      ) : null}
      {canStop ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => post(stopHref)}
          className="rounded-lg border border-zinc-500 bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
        >
          Stop launch
        </button>
      ) : null}
    </div>
  );
}
