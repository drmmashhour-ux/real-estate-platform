"use client";

import type { HubKey } from "@/lib/ai/brain";
import type { HubTheme } from "@/lib/hub/themes";

export type AiRecommendation = {
  id: string;
  title: string;
  description: string;
  urgency?: "high" | "medium" | "low";
  actionLabel?: string;
  actionHref?: string;
};

type AiActionCenterProps = {
  hubType: HubKey;
  recommendations: AiRecommendation[];
  theme?: HubTheme;
  performanceSummary?: string;
  className?: string;
};

export function AiActionCenter({
  hubType,
  recommendations,
  theme,
  performanceSummary,
  className = "",
}: AiActionCenterProps) {
  const accent = theme?.accent ?? "#1e3a8a";
  const bg = theme?.cardBg ?? "rgba(255,255,255,0.04)";
  const urgencyColor = (u: string) =>
    u === "high" ? "#ef4444" : u === "medium" ? "#f59e0b" : "#6b7280";

  return (
    <section
      className={`rounded-xl border p-4 sm:p-6 transition-all duration-200 ease-out hover:scale-[1.01] ${className}`}
      style={{ backgroundColor: bg, borderColor: `${accent}40` }}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: accent }}>
          AI Action Center
        </h3>
        <span className="rounded-full px-2 py-0.5 text-xs font-medium opacity-90" style={{ backgroundColor: `${accent}30`, color: accent }}>
          {hubType}
        </span>
      </div>
      {performanceSummary ? (
        <p className="mt-2 text-xs opacity-80" style={{ color: theme?.textMuted }}>
          {performanceSummary}
        </p>
      ) : null}
      <ul className="mt-4 space-y-3">
        {recommendations.length === 0 ? (
          <li className="text-sm opacity-70">No recommendations right now. Check back later.</li>
        ) : (
          recommendations.slice(0, 5).map((r) => (
            <li key={r.id} className="flex flex-col gap-1 rounded-lg p-2 transition-all duration-200 ease-out hover:scale-[1.02] hover:bg-white/5">
              <div className="flex items-center gap-2">
                {r.urgency ? (
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase"
                    style={{ backgroundColor: `${urgencyColor(r.urgency)}30`, color: urgencyColor(r.urgency) }}
                  >
                    {r.urgency}
                  </span>
                ) : null}
                <span className="font-medium text-sm">{r.title}</span>
              </div>
              <p className="text-xs opacity-80">{r.description}</p>
              {r.actionLabel && r.actionHref ? (
                <a
                  href={r.actionHref}
                  className="mt-1 self-start text-xs font-medium hover:underline"
                  style={{ color: accent }}
                >
                  {r.actionLabel} →
                </a>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
