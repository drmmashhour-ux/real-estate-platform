import { EARLY_USER_CAP } from "@/lib/growth/earlyUserConstants";

export type LaunchBannerUrgency = "none" | "accent" | "critical";

export function getLaunchBannerUrgency(remaining: number): LaunchBannerUrgency {
  if (remaining <= 10) return "critical";
  if (remaining <= 20) return "accent";
  return "none";
}

export function launchBannerCtaLabel(remaining: number): { cta: string; message: string } {
  const r = Math.max(0, remaining);
  const spots = r === 1 ? "1 spot" : `${r} spots`;
  if (r <= 0) {
    return {
      cta: "Join waitlist",
      message: `The first ${EARLY_USER_CAP} are in — you can still join the waitlist.`,
    };
  }
  return {
    cta: "Join early access",
    message: `Launching soon — join the first ${EARLY_USER_CAP} users — ${spots} left`,
  };
}

export function earlyUsersJoinedLine(currentUsers: number): string {
  return `${Math.max(0, Math.floor(currentUsers)).toLocaleString()} early users joined`;
}
