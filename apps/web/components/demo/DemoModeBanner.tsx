import { isDemoModeBannerVisible } from "@/lib/demo/bannerState";

/**
 * Top-of-app notice when demo data is active (Order 61).
 * Server-only visibility via env + (dev) cookie; see `lib/demo/bannerState.ts`.
 */
export async function DemoModeBanner() {
  const on = await isDemoModeBannerVisible();
  if (!on) return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-[100] border-b border-amber-500/30 bg-amber-950/90 px-4 py-2 text-center text-sm text-amber-100"
    >
      Demo mode — data is simulated. Nothing here writes to your production database.
    </div>
  );
}
