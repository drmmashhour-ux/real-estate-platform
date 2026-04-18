/**
 * Resettable simulation data — optional future: prisma seed targeting SIMULATION_DATA_PREFIX.
 * Current platform simulation does not mutate production-like rows unless `executeLiveStripeBooking` runs
 * (engine creates then deletes test users/listings/bookings).
 */
export function describeSimulationDataPolicy(): string {
  return "Live Stripe E2E uses isolated host/guest/listing rows and cleans up unless E2E_SKIP_CLEANUP=1.";
}
