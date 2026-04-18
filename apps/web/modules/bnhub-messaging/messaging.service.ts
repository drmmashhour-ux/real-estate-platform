/**
 * BNHub messaging facade — real persistence lives in `bnhubInquiryThread` / `bookingMessage` / API routes.
 * Import server handlers from `@/app/api/bnhub/messages/route` consumers; this module is for shared types/helpers.
 */
export type BnhubMessageChannel = "inquiry" | "booking";
