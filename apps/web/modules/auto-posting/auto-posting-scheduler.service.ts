import { addHours, addMinutes, format, parseISO, startOfHour } from "date-fns";
import type { PostingPlatform } from "./auto-posting.types";
import { listPostingQueue } from "./auto-posting-queue.service";

const POSTING_WINDOWS: Record<string, { start: number; end: number }> = {
  morning: { start: 8, end: 11 },
  evening: { start: 18, end: 21 },
};

export function getNextAvailableSlot(platform: PostingPlatform, preferredDate?: Date): string {
  const baseDate = preferredDate || new Date();
  const queue = listPostingQueue().filter(p => p.platform === platform && p.scheduledAt);
  
  // Find a slot that doesn't overlap (min 60 mins apart)
  let candidate = startOfHour(addHours(baseDate, 1));
  
  // Simple heuristic: avoid clustering
  let iterations = 0;
  while (iterations < 48) { // Max 2 days ahead
    const iso = candidate.toISOString();
    const tooClose = queue.some(p => {
      const scheduled = parseISO(p.scheduledAt!);
      const diffMins = Math.abs(scheduled.getTime() - candidate.getTime()) / 60000;
      return diffMins < 60;
    });
    
    const hour = candidate.getHours();
    const inWindow = (hour >= POSTING_WINDOWS.morning!.start && hour <= POSTING_WINDOWS.morning!.end) ||
                     (hour >= POSTING_WINDOWS.evening!.start && hour <= POSTING_WINDOWS.evening!.end);
    
    if (!tooClose && inWindow) {
      return iso;
    }
    
    candidate = addMinutes(candidate, 30);
    iterations++;
  }
  
  return candidate.toISOString();
}

export function autoSchedulePost(postId: string) {
  // Logic to pick a slot and update the post
}
