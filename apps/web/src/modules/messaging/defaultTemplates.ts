/** Default rows for `message_templates` (seed when empty). */
export const DEFAULT_MESSAGE_TEMPLATES: {
  segment: string;
  type: string;
  subject: string;
  content: string;
}[] = [
  {
    segment: "warm",
    type: "first_message",
    subject: "Quick favor — LECIPM",
    content: `Hi {{name}},

I just launched a real estate + booking platform (LECIPM + BNHUB) and need honest feedback.

Can you try one thing today — browse, send an inquiry, or test a booking? It takes 2–3 minutes.

Thank you 🙏`,
  },
  {
    segment: "warm",
    type: "follow_up",
    subject: "Following up — LECIPM",
    content: `Hi {{name}},

Quick reminder — I'd really value your feedback. Even 2 minutes helps me see where people get stuck.

Reply when you can.`,
  },
  {
    segment: "warm",
    type: "force_action",
    subject: "One quick action on LECIPM?",
    content: `Hi {{name}},

If you have 2 minutes, could you try one real action on the platform — like sending an inquiry or starting a booking?

I want to validate everything with real users. Happy to stay with you while you do it.`,
  },
  {
    segment: "buyer",
    type: "first_message",
    subject: "Opportunities in {{city}}",
    content: `Hi {{name}},

I'm opening LECIPM to a small group in {{city}} — browse listings and send inquiries directly.

Would you like the link?`,
  },
  {
    segment: "buyer",
    type: "conversion_push",
    subject: "Complete your booking",
    content: `Hi {{name}},

If you'd like, I can help you finish the booking — it's secure (Stripe), quick, and you'll get confirmation right away.

Want me to walk you through it?`,
  },
  {
    segment: "broker",
    type: "first_message",
    subject: "Broker early access — LECIPM",
    content: `Hi {{name}},

We're onboarding a small group of brokers: premium visibility, early leads, fast routing.

Open to testing it? We need quick response times to validate the system.`,
  },
  {
    segment: "host",
    type: "first_message",
    subject: "BNHUB — list your stay",
    content: `Hi {{name}},

We're onboarding hosts on BNHUB (short-term) with early exposure.

Want to list one property and test bookings with us this week?`,
  },
  {
    segment: "broker",
    type: "follow_up",
    subject: "Broker onboarding — LECIPM",
    content: `Hi {{name}},

Following up — we're only onboarding a few brokers in this phase. Want me to send the setup link?`,
  },
  {
    segment: "host",
    type: "follow_up",
    subject: "Activate your BNHUB listing",
    content: `Hi {{name}},

Let's activate your listing and test bookings this week — reply if you want a quick setup walkthrough.`,
  },
  {
    segment: "warm",
    type: "objection_expensive",
    subject: "Re: pricing",
    content: `Totally fair — a lot of people compare options at this stage.

Just so I understand, is it the price itself or you're comparing with something else?

That makes sense. What most people realize is that verified listings + transparency actually save them from costly surprises later.

If you'd like, I can show you a couple of options that fit your budget better so you can compare.`,
  },
  {
    segment: "warm",
    type: "objection_trust",
    subject: "Trust & safety — LECIPM",
    content: `That's a very good question — and honestly one of the main reasons this platform exists.

• listings are verified
• payments are secured through Stripe
• everything is clearly shown before you commit

If you want, I can walk you through exactly how it works.

You're not committing blindly — you're just securing your spot while everything stays transparent.`,
  },
  {
    segment: "warm",
    type: "objection_hesitation",
    subject: "Happy to clarify",
    content: `Totally understandable — just so I can help you better, what's making you hesitate right now?

That makes sense.

What I'd recommend is moving forward with the request — it keeps your options open without locking you into anything beyond what's clear at checkout. I'm here if anything feels unclear.`,
  },
  {
    segment: "warm",
    type: "objection_later",
    subject: "Timing",
    content: `Of course — timing matters.

Just so you don't miss it, these types of listings tend to move quickly in this area.

Would you prefer I hold this option for you or show you similar ones so you can compare now?`,
  },
  {
    segment: "warm",
    type: "objection_think",
    subject: "Take your time",
    content: `Of course — that's completely normal.

Just so you don't lose the opportunity, would you like to secure it now while you think it through?

If you want, we can do it together — it takes less than a minute and I'll make sure everything goes smoothly.`,
  },
  {
    segment: "warm",
    type: "assisted_close",
    subject: "Quick help",
    content: `Hi {{name}},

If you want, we can do it together — it takes less than a minute and I'll make sure everything goes smoothly.

Just tell me when you're ready.`,
  },
  {
    segment: "warm",
    type: "ghosting_follow_up",
    subject: "Checking in",
    content: `Hi {{name}} — just checking in. I didn't want you to miss this if you were still interested.

Just a quick note — this type of listing usually doesn't stay available long. Let me know if you want help securing it or exploring alternatives.`,
  },
];
