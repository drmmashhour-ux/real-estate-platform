/** Photo count limits for DIY seller subscription tiers (not publish plan). */
export function getFsboMaxPhotosForSellerPlan(plan: string | null | undefined): number {
  const p = (plan ?? "basic").toLowerCase();
  switch (p) {
    case "basic":
      return 5; // FREE
    case "assisted":
      return 20; // PRO
    case "premium":
      return 50; // unlimited-ish
    default:
      return 5;
  }
}

export function isFsboMaxPhotosLimitReached(args: {
  sellerPlan: string | null | undefined;
  currentCount: number;
  addingCount: number;
}): boolean {
  const max = getFsboMaxPhotosForSellerPlan(args.sellerPlan);
  return args.currentCount + args.addingCount > max;
}

export type FsboPhotoType = "EXTERIOR" | "INTERIOR" | "STREET_VIEW" | "OTHER";

export const FSBO_PHOTO_TYPES: FsboPhotoType[] = ["EXTERIOR", "INTERIOR", "STREET_VIEW", "OTHER"];

