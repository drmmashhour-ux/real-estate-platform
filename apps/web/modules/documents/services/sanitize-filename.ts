/** Remove path segments and dangerous characters; keep extension. */
export function sanitizeFileNameForStorage(name: string): string {
  const base = name.replace(/[/\\]/g, "").replace(/^\.+/, "").trim() || "file";
  const cleaned = base.replace(/[^\w.\- ()[\]]+/g, "_").slice(0, 180);
  return cleaned || "file";
}
