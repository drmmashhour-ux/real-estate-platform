import "server-only";

/** Stub — tighten with investment feature flags when product path is finalized. */
export async function investmentFeaturesOr403(): Promise<import("next/server").NextResponse | null> {
  return null;
}
