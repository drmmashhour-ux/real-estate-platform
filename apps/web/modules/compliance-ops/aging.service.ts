export function daysOpen(createdAt: Date): number {
  return Math.floor((Date.now() - createdAt.getTime()) / 86400000);
}
