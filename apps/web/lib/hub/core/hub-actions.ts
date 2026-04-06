/**
 * Safe, declarative hub actions for dashboards and AI (no execution here).
 */

export type HubActionKind = "navigate" | "api" | "message_template";

export type HubActionDef = {
  id: string;
  labelKey: string;
  kind: HubActionKind;
  /** Route or API path — validated by caller */
  target: string;
  requiresRoles?: import("./hub-types").HubRole[];
};
