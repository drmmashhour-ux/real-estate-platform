const ANGLES = [
  "contrarian truth",
  "checklist",
  "story-driven",
  "myth vs reality",
  "step-by-step",
  "risk/reward framing",
] as const;

export function selectContentAngle(planDate: string, salt = ""): string {
  let h = 0;
  const s = planDate + salt;
  for (let i = 0; i < s.length; i++) h = (h * 17 + s.charCodeAt(i)) | 0;
  return ANGLES[Math.abs(h) % ANGLES.length]!;
}
