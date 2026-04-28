"use client";

type Props = {
  visible: boolean;
  caption: string | null;
};

/**
 * Bottom overlay when auto-narration is active — deterministic copy only (caller guard).
 */
export function NarrationCaption({ visible, caption }: Props) {
  if (!visible || !caption?.trim()) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      key={caption}
      className="fixed inset-x-4 bottom-[4.25rem] z-[54] mx-auto max-w-2xl rounded-2xl border border-violet-400/90 bg-violet-950/92 px-4 py-3 text-center text-sm leading-snug text-violet-50 opacity-95 shadow-xl transition-opacity duration-300 ease-out sm:inset-x-auto sm:left-1/2 sm:w-full sm:-translate-x-1/2"
    >
      <span className="font-semibold text-violet-200">🎙️</span>{" "}
      <span className="text-violet-50">{caption}</span>
    </div>
  );
}
