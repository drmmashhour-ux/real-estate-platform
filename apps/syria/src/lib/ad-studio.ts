export const AD_STUDIO_STYLES = ["price", "highlight", "clean"] as const;
export type AdStudioStyle = (typeof AD_STUDIO_STYLES)[number];

/** Props for the CSS-only preview — no image processing. */
export type AdStudioPreviewListing = {
  image: string | null;
  title: string;
  price: string;
  city: string;
};

export function isAdStudioStyle(v: string | null | undefined): v is AdStudioStyle {
  return (AD_STUDIO_STYLES as readonly string[]).includes(v ?? "");
}
