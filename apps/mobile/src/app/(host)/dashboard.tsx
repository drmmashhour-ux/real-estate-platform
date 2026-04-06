import { Redirect } from "expo-router";

/** Canonical host bookings hub lives at `/host/dashboard`. */
export default function HostDashboardRedirect() {
  return <Redirect href="/host/dashboard" />;
}
