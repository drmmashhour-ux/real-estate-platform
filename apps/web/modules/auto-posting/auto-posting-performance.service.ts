import type { PostingItem, PerformanceSnapshot } from "./auto-posting.types";
import { listPostingQueue } from "./auto-posting-queue.service";

export function getPostingSummary() {
  const all = listPostingQueue();
  const posted = all.filter(p => p.status === "POSTED");
  const failed = all.filter(p => p.status === "FAILED");
  
  const totalImpressions = posted.reduce((acc, p) => acc + (p.performanceSnapshot?.impressions || 0), 0);
  const totalClicks = posted.reduce((acc, p) => acc + (p.performanceSnapshot?.clicks || 0), 0);
  
  return {
    totalPosted: posted.length,
    totalFailed: failed.length,
    totalImpressions,
    totalClicks,
    platforms: Array.from(new Set(all.map(p => p.platform))),
  };
}

export function recordPerformanceSnapshot(postId: string, snapshot: PerformanceSnapshot) {
  // Update post with latest snapshot
}
