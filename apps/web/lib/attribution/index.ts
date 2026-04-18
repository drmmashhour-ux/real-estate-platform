/**
 * First-touch + UTM attribution for signups, leads, and traffic events.
 */
export { buildSignupAttributionPayload, type SignupAttributionPayload, type AcquisitionChannel } from "./signup-attribution";
export { getLeadAttributionFromRequest, type LeadAttribution } from "./lead-attribution";
export { getRegisterTrafficFieldsForBody } from "./register-attribution-client";
