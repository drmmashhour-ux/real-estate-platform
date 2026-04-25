export interface OutreachTemplate {
  id: string;
  name: string;
  content: string;
  description: string;
}

export const OUTREACH_TEMPLATES: OutreachTemplate[] = [
  {
    id: "first_message",
    name: "FIRST MESSAGE",
    content: "Hey! I’m building a real estate AI tool that helps brokers close more deals and prioritize leads. I’m onboarding a few brokers early — want to try it?",
    description: "Low-pressure hook for initial outreach."
  },
  {
    id: "follow_up",
    name: "FOLLOW-UP",
    content: "Quick follow-up — I can show you how it prioritizes your deals and suggests what to do next. Takes 2 minutes.",
    description: "Gentle nudge after no response."
  },
  {
    id: "value_push",
    name: "VALUE PUSH",
    content: "It basically tells you which deal to focus on + what to say next. Early brokers are already using it daily.",
    description: "Concrete value proposition to drive interest."
  }
];

export function getOutreachTemplates() {
  return OUTREACH_TEMPLATES;
}

export function getTemplateById(id: string) {
  return OUTREACH_TEMPLATES.find(t => t.id === id);
}
