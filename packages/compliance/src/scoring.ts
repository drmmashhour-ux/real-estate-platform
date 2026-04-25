export function computeComplianceScore(input: {
  missingDocs: number;
  complaints: number;
  trustIssues: number;
  anomalies: number;
}) {
  let score = 100;

  score -= input.missingDocs * 5;
  score -= input.complaints * 10;
  score -= input.trustIssues * 20;
  score -= input.anomalies * 8;

  if (score < 0) score = 0;

  let grade = "A";
  if (score < 90) grade = "B";
  if (score < 75) grade = "C";
  if (score < 60) grade = "D";
  if (score < 40) grade = "E";

  let riskLevel = "low";
  if (score < 75) riskLevel = "moderate";
  if (score < 60) riskLevel = "high";
  if (score < 40) riskLevel = "critical";

  return { score, grade, riskLevel };
}
