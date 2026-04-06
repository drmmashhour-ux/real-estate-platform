import { ClientFollowUpType } from "@prisma/client";

export function buildClientFollowUpEmail(input: {
  type: ClientFollowUpType;
  name: string | null;
  title: string;
  message: string;
}) {
  const greeting = input.name ? `Hi ${input.name},` : "Hello,";

  if (input.type === ClientFollowUpType.BIRTHDAY_GREETING) {
    return {
      subject: "Happy birthday from LECIPM",
      html: `<p>${greeting}</p><p>${input.message}</p><p>Wishing you a beautiful day and continued success with your real estate plans.</p>`,
    };
  }

  if (input.type === ClientFollowUpType.NEW_MATCH) {
    return {
      subject: input.title,
      html: `<p>${greeting}</p><p>${input.message}</p><p>We identified fresh offers that align with your recent activity on the platform.</p>`,
    };
  }

  if (input.type === ClientFollowUpType.INACTIVITY_NUDGE) {
    return {
      subject: "New opportunities since your last visit",
      html: `<p>${greeting}</p><p>${input.message}</p><p>Return when ready and we will help you compare the strongest next options.</p>`,
    };
  }

  return {
    subject: input.title,
    html: `<p>${greeting}</p><p>${input.message}</p>`,
  };
}
