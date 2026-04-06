/**
 * Hub notification contracts — platform notifications remain authoritative; this is typing only.
 */

export type HubNotificationChannel = "email" | "push" | "in_app" | "sms";

export type HubNotificationTemplateRef = {
  hubKey: string;
  templateId: string;
  locale: string;
};
