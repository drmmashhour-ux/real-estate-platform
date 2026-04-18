/** Every negotiation autopilot output requires broker confirmation before drafting official CP/PP in publisher systems. */
export function requiresBrokerApproval(): true {
  return true;
}
