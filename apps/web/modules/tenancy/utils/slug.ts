/** URL-safe workspace slug from display name. */
export function slugifyTenantName(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .slice(0, 48);
  return base || "workspace";
}
