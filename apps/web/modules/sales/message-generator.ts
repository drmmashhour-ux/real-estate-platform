/**
 * Canonical script bodies + per-channel formatting for automated sales outreach.
 */

export type SalesChannel = "sms" | "email" | "in_app";

/** Maps to docs/growth/ai-sales-scripts.md scripts 1–5 */
export type SalesScriptId = 1 | 2 | 3 | 4 | 5;

export const SALES_SCRIPT_IDS: SalesScriptId[] = [1, 2, 3, 4, 5];

/** Full “chat” body (used as plain text / in-app). */
export function getScriptBody(scriptId: SalesScriptId): string {
  switch (scriptId) {
    case 1:
      return [
        "Hi, I saw you were interested in this property.",
        "We’ve prepared an AI-powered analysis to help you understand its real value.",
        "",
        "Would you like me to show you the insights?",
      ].join("\n");
    case 2:
      return [
        "This property has a strong potential, but there are a few important factors most buyers miss.",
        "",
        "I can show you the deal score and risk level.",
      ].join("\n");
    case 3:
      return [
        "With LECIPM, you don’t just see listings —",
        "you understand whether it’s a good deal or not.",
      ].join("\n");
    case 4:
      return ["Good opportunities move fast.", "", "Do you want me to walk you through this one before it’s gone?"].join("\n");
    case 5:
      return [
        "Let’s do a quick demo — it takes 5 minutes and you’ll see how to identify better deals instantly.",
      ].join("\n");
    default: {
      const _x: never = scriptId;
      return _x;
    }
  }
}

function emailSubject(scriptId: SalesScriptId): string {
  switch (scriptId) {
    case 1:
      return "Your property interest — AI insights ready";
    case 2:
      return "Deal score & risk — what many buyers miss";
    case 3:
      return "Beyond listings — is it a good deal?";
    case 4:
      return "Still interested? Let’s walk through this opportunity";
    case 5:
      return "5-minute demo — find better deals with LECIPM";
    default: {
      const _x: never = scriptId;
      return _x;
    }
  }
}

/** SMS variants: short, opt-in friendly; append link at send time in the worker. */
function smsShortBody(scriptId: SalesScriptId): string {
  switch (scriptId) {
    case 1:
      return "Hi — you showed interest in a property. We have an AI analysis of value & fit. Reply YES for key insights.";
    case 2:
      return "Quick note: buyers often miss risk factors on this type of listing. Want deal score + risk summary? Reply YES.";
    case 3:
      return "LECIPM helps you judge a good deal, not just browse. Want a 2-min overview? Reply YES.";
    case 4:
      return "Good listings move fast. Want a quick walkthrough before it’s gone? Reply YES.";
    case 5:
      return "Free 5-min demo — spot better deals faster. Reply YES or use the link we emailed you.";
  }
}

export type FormattedSalesMessage = {
  scriptId: SalesScriptId;
  channel: SalesChannel;
  subject: string | null;
  /** Primary text the channel should render */
  body: string;
  /** Optional plain text duplicate for email multipart */
  bodyPlain?: string;
};

const SMS_MAX = 480;

export function formatSalesMessage(scriptId: SalesScriptId, channel: SalesChannel): FormattedSalesMessage {
  const plain = getScriptBody(scriptId);
  if (channel === "sms") {
    let body = smsShortBody(scriptId);
    if (body.length > SMS_MAX) body = `${body.slice(0, SMS_MAX - 3)}...`;
    return { scriptId, channel, subject: null, body };
  }
  if (channel === "email") {
    return {
      scriptId,
      channel,
      subject: emailSubject(scriptId),
      body: plain.replace(/\n/g, "<br />\n"),
      bodyPlain: plain,
    };
  }
  return { scriptId, channel, subject: null, body: plain };
}
