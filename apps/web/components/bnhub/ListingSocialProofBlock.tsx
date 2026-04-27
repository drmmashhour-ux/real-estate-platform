import type { SocialProofResult } from "@/lib/ai/socialProof";
import { cn } from "@/lib/utils";

type Props = {
  /** When set, emphasize the block for high-intent users (Order 47). */
  emphasize?: boolean;
  sp: SocialProofResult;
};

/**
 * Real-metric social proof strip for BNHub stay detail (Order 47).
 */
export function ListingSocialProofBlock({ sp, emphasize }: Props) {
  if (sp.messages.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3",
        emphasize && "ring-1 ring-amber-500/40"
      )}
      aria-label="Listing activity"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Social proof</p>
      <ul className="mt-2 space-y-1.5 text-sm text-white/90">
        {sp.messages.map((line, i) => {
          const hot = i === 0 && sp.strength === "high";
          return (
            <li key={`${line}-${i}`} className="flex gap-2">
              <span className="shrink-0 text-base" aria-hidden>
                {hot ? "🔥" : "✓"}
              </span>
              <span className={cn(hot && "font-semibold text-amber-100/95")}>{line}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
