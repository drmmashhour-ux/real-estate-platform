/**
 * Cold / warm investor intro copy (Order 51). Edit here; paste into email or CRM.
 */
export function generateInvestorMessage(name: string) {
  const who = name.trim() || "there";
  return `
Hi ${who},

I'm building LECIPM, a self-optimizing real estate marketplace that uses AI to manage pricing, trust, compliance, and growth.

We've built a working platform with:
- dynamic pricing engine
- compliance automation
- autonomous optimization system

We are currently onboarding our first users and would love to share a short demo with you.

Would you be open to a quick 10-minute call?

Best regards,
Founder
`.trimStart();
}
