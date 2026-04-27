/**
 * SYBNB stay bookings on `SyriaBooking` (request → host response → pay → confirmed).
 * Prisma `SybnbBooking` exists in schema for future use; app flow uses `SyriaBooking` + `category=stay`.
 */
export type { SybnbStayRequestBlockCode } from "./sybnb-booking-rules";
export {
  hostMayEnableSybnbInstantBook,
  evaluateSybnbStayRequestEligibility,
  sybnbBookingRowMatchesServerQuote,
} from "./sybnb-booking-rules";
export { isAllowedSybnbStayStatusTransition } from "./sybnb-state-machine";
export { runSybnbHostStayResponse, type SybnbHostStayResponseError } from "./host-stay-response";
export { applySybnbCheckoutComplete, type SybnbCheckoutApplyError } from "./apply-sybnb-checkout";
