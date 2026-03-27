/** Proven DM scripts for first-client outreach (copy buttons in dashboard). */
export const FIRST_TEN_DM_SCRIPTS = [
  {
    id: "dm-1",
    label: "Script 1 — Intro + free guidance",
    text: "Hey! I saw you're looking for a place in Montreal. I help people find properties and get mortgage approval easily. If you want, I can guide you for free 🙂",
  },
  {
    id: "dm-2",
    label: "Script 2 — Still looking?",
    text: "Are you still looking? I can connect you with verified experts and help you move faster.",
  },
  {
    id: "dm-3",
    label: "Script 3 — Opportunities",
    text: "I have some opportunities coming this week before they go public — want me to send them to you?",
  },
] as const;

export const FIRST_TEN_CALL_FLOW = {
  discovery: [
    "Budget — what range feels comfortable?",
    "Timeline — when do you want to move or close?",
    "Location — which areas are you focused on?",
  ],
  position: "I help you save time and connect you with the right experts.",
  close: "Let's start now so you don't miss opportunities.",
} as const;

export const FIRST_TEN_FOLLOW_UP_SEQUENCE = [
  { day: 1, label: "Day 1 → follow-up", hint: "Check in; reference your first DM." },
  { day: 3, label: "Day 3 → reminder", hint: "Light nudge; offer a quick call." },
  { day: 7, label: "Day 7 → final message", hint: "Last helpful touch; leave door open." },
] as const;

export const FIRST_TEN_MOTIVATION =
  "You need only 10 clients to validate your business. Stay consistent — one conversation at a time.";
