export const DARLINK_THEME_NAMESPACE = "darlink";

export const DARLINK_FORBIDDEN_IMPORTS = ["lec_ipm", "lecipm", "black-gold"];

export function assertDarlinkIsolation() {
  return {
    namespace: DARLINK_THEME_NAMESPACE,
    forbidden: DARLINK_FORBIDDEN_IMPORTS,
    note: "Darlink must remain isolated from LECIPM branding and tokens",
  };
}
