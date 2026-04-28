"use client";

import type { NarrationLang } from "@/lib/demo/narration-registry";

type Props = {
  visible: boolean;
  caption: string | null;
  locale: NarrationLang;
};

/**
 * Bottom overlay when auto-narration is active — deterministic copy only (caller guard).
 */
export function NarrationCaption({ visible, caption, locale }: Props) {
  if (!visible || !caption?.trim()) return null;

  const tag = locale.toUpperCase();

  return (
    <div
      role="status"
      aria-live="polite"
      key={`${locale}:${caption}`}
      className="fixed inset-x-4 bottom-[4.25rem] z-[54] mx-auto max-w-2xl rounded-2xl border border-violet-400/90 bg-violet-950/92 px-4 py-3 text-center text-sm leading-snug text-violet-50 opacity-95 shadow-xl transition-opacity duration-300 ease-out sm:inset-x-auto sm:left-1/2 sm:w-full sm:-translate-x-1/2"
    >
      <span className="font-semibold text-violet-200">
        🎙️ [{tag}]
      </span>{" "}
      <span className="text-violet-50">{caption}</span>
    </div>
  );
}
