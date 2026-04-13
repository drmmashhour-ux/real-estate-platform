import type { LecipmBrokerMessageSenderRole } from "@prisma/client";

const BUYER_ROLES: LecipmBrokerMessageSenderRole[] = ["customer", "guest"];
const BROKER_ROLES: LecipmBrokerMessageSenderRole[] = ["broker", "admin"];

/**
 * Median time from a buyer/guest message to the next broker/admin reply (ms).
 * Used for SLA-style visibility in the broker listing inbox.
 */
export function computeBrokerReplyLatenciesMs(
  messages: Array<{ senderRole: LecipmBrokerMessageSenderRole; createdAt: Date }>
): number[] {
  const sorted = [...messages].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const samples: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = sorted[i]!;
    const next = sorted[i + 1]!;
    if (BUYER_ROLES.includes(cur.senderRole) && BROKER_ROLES.includes(next.senderRole)) {
      const delta = next.createdAt.getTime() - cur.createdAt.getTime();
      if (delta >= 0 && delta < 1000 * 60 * 60 * 72) {
        samples.push(delta);
      }
    }
  }
  return samples;
}

export function summarizeResponseMs(samples: number[]): {
  avgMs: number | null;
  medianMs: number | null;
  sampleCount: number;
} {
  if (samples.length === 0) {
    return { avgMs: null, medianMs: null, sampleCount: 0 };
  }
  const sum = samples.reduce((a, b) => a + b, 0);
  const avgMs = Math.round(sum / samples.length);
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianMs =
    sorted.length % 2 === 0
      ? Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2)
      : sorted[mid] ?? null;
  return { avgMs, medianMs, sampleCount: samples.length };
}
