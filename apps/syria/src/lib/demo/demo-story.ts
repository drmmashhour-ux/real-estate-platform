/**
 * Investor storytelling pitch — deterministic scenes only (no user data).
 */

export type DemoStoryScene = {
  id: string;
  title: string;
  subtitle?: string;
  /** Narration registry key (route-style keys like `/demo` or action keys like `ACTION_PAYMENT_BLOCKED`). */
  narrationKey: string;
  duration: number;
  /** Path without locale prefix (e.g. `/demo`, `/listing/demo-1`). Locale applied at runtime. */
  navigate?: string;
  highlight?: "hero" | "listing" | "drbrain";
};

export const demoStory: DemoStoryScene[] = [
  {
    id: "intro",
    title: "The Problem",
    narrationKey: "STORY_PROBLEM",
    duration: 5000,
    highlight: "hero",
  },
  {
    id: "solution",
    title: "Our Solution",
    narrationKey: "STORY_SOLUTION",
    duration: 5000,
    navigate: "/demo",
  },
  {
    id: "marketplace",
    title: "Marketplace Experience",
    narrationKey: "/demo",
    duration: 6000,
  },
  {
    id: "trust",
    title: "Trust & Verification",
    narrationKey: "/listing",
    duration: 6000,
    navigate: "/listing/demo-1",
    highlight: "listing",
  },
  {
    id: "payments",
    title: "Safe Payments",
    narrationKey: "ACTION_PAYMENT_BLOCKED",
    duration: 5000,
  },
  {
    id: "drbrain",
    title: "AI Monitoring",
    narrationKey: "/admin/dr-brain",
    duration: 6000,
    navigate: "/admin/dr-brain",
    highlight: "drbrain",
  },
  {
    id: "closing",
    title: "Why It Wins",
    narrationKey: "STORY_CLOSING",
    duration: 5000,
    navigate: "/demo",
  },
];

export const demoStoryTotalMs = demoStory.reduce((sum, s) => sum + s.duration, 0);
