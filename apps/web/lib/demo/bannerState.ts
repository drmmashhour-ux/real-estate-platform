import "server-only";

import { cookies } from "next/headers";

import { flags } from "@/lib/flags";

/**
 * True when the user should see the top-of-app demo banner (Order 61).
 * Matches {@link isDemoDataActive} intent for `Request` (env + prod gate + dev cookie).
 */
export async function isDemoModeBannerVisible(): Promise<boolean> {
  if (process.env.NODE_ENV === "production") {
    if (!flags.DEMO_MODE || !flags.DEMO_MODE_PROD) return false;
    return true;
  }
  if (flags.DEMO_MODE) return true;
  if (flags.DEMO_MODE_CLIENT_COOKIE) {
    const c = await cookies();
    if (c.get("lecipm_demo")?.value === "1") return true;
  }
  return false;
}
