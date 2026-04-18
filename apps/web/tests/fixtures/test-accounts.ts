/**
 * Simulation persona labels — do not embed real credentials.
 * Use env-driven test users in CI if you add authenticated flows.
 */
export const SIMULATION_USER_LABELS = {
  guest: "guest_test_user",
  host: "host_test_user",
  broker: "broker_test_user",
  admin: "admin_test_user",
  founder: "founder_test_user",
} as const;

export const SIMULATION_DATA_PREFIX = "sim_v1_";
