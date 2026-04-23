export function generateAppraisalReportNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 1000000);
  return `VAL-${year}-${rand}`;
}
