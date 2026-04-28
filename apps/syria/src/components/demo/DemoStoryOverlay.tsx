"use client";

/**
 * Full-viewport storytelling overlay — informational only (controls live in Demo panel).
 */
export function DemoStoryOverlay({
  visible,
  banner,
  title,
  subtitle,
  sceneLabel,
  progress01,
}: {
  visible: boolean;
  banner: string;
  title: string;
  subtitle: string | null;
  sceneLabel: string;
  progress01: number;
}) {
  if (!visible) return null;

  const pct = Math.round(progress01 * 100);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] flex flex-col justify-end bg-black/45 px-4 pb-10 pt-24 backdrop-blur-[2px]"
      data-story-overlay
    >
      <div className="pointer-events-none mx-auto w-full max-w-3xl rounded-3xl border border-white/15 bg-black/55 px-6 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-white/90">
          {banner}
        </div>
        <h2 className="mt-5 text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
        {subtitle ? (
          <p className="mt-3 text-center text-base font-medium leading-relaxed text-white/75">{subtitle}</p>
        ) : null}
        <div className="mt-8 flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-wider text-white/55">
          <span>Progress</span>
          <span aria-live="polite">{sceneLabel}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-white/25 via-white/70 to-white/25 transition-[width] duration-200 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
