/**
 * Remote demo assets for Seller Hub QA — Wikimedia Commons (free to use with attribution in UI).
 * Used to seed example galleries and to test AI rejection of non-property images.
 */

import { isSellerDemoToolsEnabled } from "@/lib/fsbo/seller-declaration-demo-fill";

/** Whether server may seed demo photos (same flag as wizard demo tools). */
export function isDemoListingPhotoSeedAllowed(): boolean {
  return isSellerDemoToolsEnabled();
}

/**
 * Bundled demo files: `public/demo-fsbo-listing/1.jpg` … `6.jpg` — owner-supplied condo tour stills (see CREDITS.txt).
 * Server falls back to remote Wikimedia URLs only if a local file is missing.
 */
export const DEMO_PROPERTY_PHOTO_LOCAL_COUNT = 6;

/**
 * Property-style examples. Fetched server-side when local files are absent.
 */
export const DEMO_PROPERTY_PHOTO_SEED_URLS: readonly string[] = [
  "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Suburban_house_in_Columbus%2C_Ohio.JPG/1024px-Suburban_house_in_Columbus%2C_Ohio.JPG",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Ikea_alcove_sofa.jpg/1024px-Ikea_alcove_sofa.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Kitchen_interior%2C_USA%2C_2008.jpg/1024px-Kitchen_interior%2C_USA%2C_2008.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/YardLandscaping.jpg/1024px-YardLandscaping.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Living_room_9074.JPG/1024px-Living_room_9074.JPG",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Living_room_9074.JPG/1024px-Living_room_9074.JPG",
];

/** Tags aligned with DEMO_PROPERTY_PHOTO_SEED_URLS order (cover = main interior for condo demos). */
export const DEMO_PROPERTY_PHOTO_TAGS: readonly string[] = [
  "INTERIOR",
  "INTERIOR",
  "INTERIOR",
  "INTERIOR",
  "INTERIOR",
  "OTHER",
];

/** Food-focused image — intended to fail `assessListingPhotoForPropertyUse` when OpenAI vision is enabled. */
export const DEMO_FOOD_REJECTION_TEST_IMAGE_URL =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/1024px-Good_Food_Display_-_NCI_Visuals_Online.jpg";

/**
 * Seller education thumbnails (illustration only). Same-origin paths under `public/demo-fsbo-listing/`
 * so images load without Wikimedia hotlink/CORS issues.
 */
export const LISTING_PHOTO_EXAMPLE_GUIDE: readonly {
  title: string;
  caption: string;
  /** Path under site root (`public/…` in repo). */
  exampleUrl: string;
}[] = [
  {
    title: "1. Exterior first",
    caption: "Street-facing exterior with visible civic or building number (door, mailbox, or facade) — required as the cover photo.",
    exampleUrl: "/demo-fsbo-listing/1.jpg",
  },
  {
    title: "2. Main rooms",
    caption: "Living area, kitchen, bedrooms — show real spaces buyers will visit.",
    exampleUrl: "/demo-fsbo-listing/2.jpg",
  },
  {
    title: "3. Yard or context",
    caption: "Yard, balcony, parking, or neighbourhood context when relevant.",
    exampleUrl: "/demo-fsbo-listing/3.jpg",
  },
];
