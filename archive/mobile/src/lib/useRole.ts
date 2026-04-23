export type AppRole = "guest" | "host" | "admin";

/** Future host/admin routing — always guest while auth is off. */
export function useRole() {
  return {
    role: "guest" as AppRole,
    loading: false,
  };
}
