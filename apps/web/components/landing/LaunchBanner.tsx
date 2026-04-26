import { getEarlyUserCount } from "@/lib/growth/earlyUsers";

const FIRST_N = 100;

/** Use as the `fallback` for `Suspense` around `LaunchBanner` (same visual baseline). */
export function LaunchBannerStatic() {
  return (
    <div className="bg-black px-3 py-3 text-center text-sm text-white" role="status">
      <span aria-hidden>🚀 </span>
      Launching soon — Join the first {FIRST_N} users
    </div>
  );
}

/**
 * Urgency strip for landing / marketing (Order 48). Optional: `remaining = 100 - currentUsers`
 * via `getEarlyUserCount()`. In a `loading.tsx` or layout, wrap in `Suspense` with
 * `LaunchBannerStatic` as fallback to avoid holding the full page on SQL.
 */
export async function LaunchBanner() {
  let currentUsers = 0;
  try {
    currentUsers = await getEarlyUserCount();
  } catch {
    return <LaunchBannerStatic />;
  }

  const remaining = Math.max(0, FIRST_N - currentUsers);
  return (
    <div className="bg-black px-3 py-3 text-center text-sm text-white" role="status">
      <span aria-hidden>🚀 </span>
      Launching soon — Join the first {FIRST_N} users
      {remaining > 0
        ? ` — ${remaining} spot${remaining === 1 ? "" : "s"} left`
        : ` — The first ${FIRST_N} are in; you can still join the waitlist.`}
    </div>
  );
}
