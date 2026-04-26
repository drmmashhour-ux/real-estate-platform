/**
 * 7-day launch execution map (Order 49) — data-only; pair with UI or ops checklists.
 */
export type LaunchPlanDay = {
  day: number;
  focus: string;
  tasks: string[];
};

export const launchPlan: readonly LaunchPlanDay[] = [
  {
    day: 1,
    focus: "Soft launch",
    tasks: [
      "Deploy production version",
      "Test full user flow (search → booking)",
      "Invite 5–10 trusted users",
    ],
  },
  {
    day: 2,
    focus: "Feedback",
    tasks: [
      "Collect user feedback",
      "Fix top 3 UX issues",
      "Improve onboarding clarity",
    ],
  },
  {
    day: 3,
    focus: "Content",
    tasks: [
      "Post 3 TikToks / Reels",
      "Share demo video",
      "Highlight AI pricing & trust system",
    ],
  },
  {
    day: 4,
    focus: "Acquisition",
    tasks: [
      "Invite 20 new users",
      "Activate referral system",
      "Track conversions",
    ],
  },
  {
    day: 5,
    focus: "Optimization",
    tasks: [
      "Improve listings quality",
      "Adjust pricing engine",
      "Enhance ranking signals",
    ],
  },
  {
    day: 6,
    focus: "Credibility",
    tasks: [
      "Add testimonials",
      "Show booking activity",
      "Improve trust badges",
    ],
  },
  {
    day: 7,
    focus: "Push",
    tasks: [
      "Launch “first 100 users” campaign",
      "Post across all platforms",
      "Prepare investor outreach",
    ],
  },
];
