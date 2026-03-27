/**
 * CRM DM copy — aligned with `/dashboard/admin/sales` (launch scripts).
 */
import {
  LAUNCH_DM_FIRST_CONTACT,
  LAUNCH_DM_FOLLOW_UP,
  LAUNCH_DM_URGENCY,
  personalizeLaunchTemplate,
} from "@/lib/launch/sales-scripts";

export const DM_TEMPLATES = {
  /** Base pattern; use `getDmTemplateForLead` for personalized first message. */
  initial: LAUNCH_DM_FIRST_CONTACT,
  followUp: LAUNCH_DM_FOLLOW_UP,
  closing: LAUNCH_DM_URGENCY,
} as const;

export type DmTemplateKey = keyof typeof DM_TEMPLATES;

/** Short pre-fill when opening WhatsApp from CRM */
export const DM_WHATSAPP_OPENING_LINE =
  "Hey! I saw you're looking for a place in Montreal. I help people find properties and get mortgage approval easily — happy to guide you for free if useful.";

export function getDmTemplate(key: DmTemplateKey): string {
  if (key === "initial") {
    return personalizeLaunchTemplate(LAUNCH_DM_FIRST_CONTACT, { city: "Montreal" });
  }
  return DM_TEMPLATES[key];
}

export function getDmTemplateForLead(
  key: DmTemplateKey,
  ctx: { name: string; city?: string | null }
): string {
  if (key === "initial") {
    return personalizeLaunchTemplate(LAUNCH_DM_FIRST_CONTACT, {
      name: ctx.name,
      city: ctx.city ?? "Montreal",
    });
  }
  if (key === "followUp") return LAUNCH_DM_FOLLOW_UP;
  return LAUNCH_DM_URGENCY;
}
