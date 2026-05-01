"use client";

import type { VoiceConversationPhase } from "@/lib/ai/useVoiceConversation";

const BAR_COUNT = 5;

function barAnimation(phase: VoiceConversationPhase, i: number): string {
  if (phase === "listening") {
    return `voice-bar-listening ${0.4 + i * 0.12}s ease-in-out ${i * 0.07}s infinite alternate`;
  }
  if (phase === "speaking") {
    return `voice-bar-speaking ${0.3 + i * 0.08}s ease-in-out ${i * 0.05}s infinite alternate`;
  }
  return "none";
}

function barColor(phase: VoiceConversationPhase): string {
  switch (phase) {
    case "listening":
      return "#D4AF37";
    case "processing":
      return "#D4AF37";
    case "speaking":
      return "#A3E635";
    default:
      return "#D4AF37";
  }
}

export function VoiceWaveform({
  phase,
  size = 32,
}: {
  phase: VoiceConversationPhase;
  size?: number;
}) {
  const color = barColor(phase);
  const barWidth = Math.max(2, size / 10);
  const gap = Math.max(1.5, size / 14);
  const totalWidth = BAR_COUNT * barWidth + (BAR_COUNT - 1) * gap;
  const offsetX = (size - totalWidth) / 2;

  return (
    <>
      <style>{`
        @keyframes voice-bar-listening {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
        @keyframes voice-bar-speaking {
          0% { transform: scaleY(0.2); }
          100% { transform: scaleY(0.9); }
        }
        @keyframes voice-bar-processing {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
        className="inline-block"
      >
        {Array.from({ length: BAR_COUNT }, (_, i) => {
          const x = offsetX + i * (barWidth + gap);
          const maxH = size * 0.7;
          const minH = size * 0.2;
          const h = phase === "processing" ? minH : maxH;
          return (
            <rect
              key={i}
              x={x}
              y={size / 2 - h / 2}
              width={barWidth}
              height={h}
              rx={barWidth / 2}
              fill={color}
              opacity={phase === "idle" || phase === "paused" ? 0.3 : 0.9}
              style={{
                transformOrigin: `${x + barWidth / 2}px ${size / 2}px`,
                animation:
                  phase === "processing"
                    ? `voice-bar-processing 1.2s ease-in-out ${i * 0.15}s infinite`
                    : barAnimation(phase, i),
                transition: "opacity 0.3s",
              }}
            />
          );
        })}
      </svg>
    </>
  );
}
