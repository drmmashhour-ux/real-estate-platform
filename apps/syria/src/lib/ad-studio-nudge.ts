/**
 * SYBNB-136 — Surface Ad Studio when traction is low (views or contacts).
 */
export function shouldShowAdStudioOptimizeNudge(p: {
  status: string;
  views?: number | null;
  whatsappClicks?: number | null;
  phoneClicks?: number | null;
}): boolean {
  if (p.status !== "PUBLISHED") return false;
  const views = p.views ?? 0;
  const contacts = (p.whatsappClicks ?? 0) + (p.phoneClicks ?? 0);
  return views < 10 || contacts === 0;
}
