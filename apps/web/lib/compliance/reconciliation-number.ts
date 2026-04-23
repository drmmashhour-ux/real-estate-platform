export function generateReconciliationNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 100000);
  return `REC-${year}-${rand}`;
}
