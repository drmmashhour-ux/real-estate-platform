import { analyzeCallReplay } from "./call-replay-analysis.service";
import { listRecordings } from "./call-storage.service";

export type ReplayHistoryPoint = {
  recordingId: string;
  title: string;
  createdAtIso: string;
  overallScore: number;
};

export function buildReplayPerformanceHistory(): ReplayHistoryPoint[] {
  return listRecordings().map((r) => ({
    recordingId: r.recordingId,
    title: r.title,
    createdAtIso: r.createdAtIso,
    overallScore: analyzeCallReplay(r.transcript).overallScore,
  }));
}

export function improvementTrendReplay(): { improving: boolean; delta: number } {
  const pts = buildReplayPerformanceHistory().sort((a, b) => a.createdAtIso.localeCompare(b.createdAtIso));
  if (pts.length < 3) return { improving: false, delta: 0 };
  const mid = Math.floor(pts.length / 2);
  const first = pts.slice(0, mid);
  const second = pts.slice(mid);
  const a = first.reduce((s, p) => s + p.overallScore, 0) / first.length;
  const b = second.reduce((s, p) => s + p.overallScore, 0) / second.length;
  return { improving: b > a, delta: Math.round((b - a) * 10) / 10 };
}

export function aggregateCommonTags(recordings = listRecordings()): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const r of recordings) {
    for (const tag of Object.values(r.segmentTags ?? {})) {
      freq[tag] = (freq[tag] ?? 0) + 1;
    }
  }
  return freq;
}
