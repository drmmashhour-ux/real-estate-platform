type Row = {
  score: number;
  contentItem: { topic: string };
};

export function optimizeTopicMix(scored: Row[]): string[] {
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const topTopics = sorted.slice(0, 5).map((r) => r.contentItem.topic);
  const weak = sorted.slice(-3).map((r) => r.contentItem.topic);
  const rec: string[] = [];
  if (topTopics.length) {
    rec.push(`Increase share of winning themes: ${topTopics.slice(0, 2).join(" · ")}`);
  }
  if (weak.length) {
    rec.push(`Reduce or rework low performers: ${weak[0]?.slice(0, 60)}…`);
  }
  if (!rec.length) rec.push("Maintain 2 education : 1 product : 1 story ratio for 14 days.");
  return rec;
}
