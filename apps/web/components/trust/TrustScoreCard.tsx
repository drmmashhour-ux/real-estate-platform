import { ScoreCircle } from "@/components/ui/ScoreCircle";

export function TrustScoreCard({
  score,
  max = 100,
  label = "Trust score",
  sublabel,
  size = "lg",
}: {
  score: number | null;
  max?: number;
  label?: string;
  sublabel?: string;
  size?: "sm" | "md" | "lg";
}) {
  if (score == null) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#121212] p-6 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A1A1A1]">{label}</p>
        <p className="mt-4 text-sm text-[#A1A1A1]">Complete your declaration and documents to generate a score.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-premium-gold/25 bg-gradient-to-b from-premium-gold/[0.08] to-[#121212] p-6 text-center shadow-[0_0_40px_rgb(var(--premium-gold-channels) / 0.1)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-premium-gold">{label}</p>
      <div className="mt-4 flex justify-center">
        <ScoreCircle value={score} max={max} size={size} />
      </div>
      {sublabel ? <p className="mt-4 text-xs text-[#A1A1A1]">{sublabel}</p> : null}
    </div>
  );
}
