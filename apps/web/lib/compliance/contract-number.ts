/** Human-readable instrument prefix (alphanumeric only). */
export function generateContractNumber(type: string) {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 100000);
  const prefix = type
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 24) || "DOC";
  return `${prefix}-${year}-${String(rand).padStart(5, "0")}`;
}
