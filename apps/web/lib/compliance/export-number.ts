export function generateExportNumber(type: string): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 100000);
  const safe = type.replace(/[^a-z0-9_-]/gi, "").toUpperCase() || "GEN";
  return `EXP-${safe}-${year}-${rand}`;
}
