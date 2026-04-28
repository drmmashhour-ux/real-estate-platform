/**
 * ORDER SYBNB-100 — Accept only assets uploaded to this project's Cloudinary account
 * (listing proofs must not point at arbitrary hosts).
 */
export function isTrustedDarlinkCloudinaryProofUrl(url: string): boolean {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  if (!cloud) return false;
  const raw = url.trim();
  if (!raw.startsWith("https://")) return false;
  try {
    const u = new URL(raw);
    if (u.hostname !== "res.cloudinary.com") return false;
    const seg = u.pathname.split("/").filter(Boolean);
    return seg[0] === cloud;
  } catch {
    return false;
  }
}
