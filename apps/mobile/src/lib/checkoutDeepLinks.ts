import * as Linking from "expo-linking";

/** Stripe return URLs for in-app booking checkout (Expo scheme from app.config). */
export function bnhubBookingCheckoutUrls(bookingId: string) {
  const successBase = Linking.createURL("/payment-success").split("?")[0];
  const cancelBase = Linking.createURL("/payment").split("?")[0];
  return {
    successUrl: `${successBase}?bookingId=${encodeURIComponent(bookingId)}&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${cancelBase}?bookingId=${encodeURIComponent(bookingId)}&paymentCancelled=1`,
  };
}
