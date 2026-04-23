/** @deprecated Prefer `detectComplaintSpikeAnomaly` — name kept for spec alignment. */
export function detectAnomalies(input: { avgComplaints: number; currentComplaints: number }) {
  return detectComplaintSpikeAnomaly(input);
}

export function detectComplaintSpikeAnomaly(input: {
  avgComplaints: number;
  currentComplaints: number;
}): {
  anomalyType: string;
  severity: string;
  description: string;
  baselineValue: number;
  detectedValue: number;
} | null {
  const baseline = Math.max(input.avgComplaints, 0);
  if (baseline <= 0 && input.currentComplaints >= 3) {
    return {
      anomalyType: "unusual_frequency",
      severity: "high",
      description: "Elevated complaint count with no prior baseline window — review intake pattern.",
      baselineValue: baseline,
      detectedValue: input.currentComplaints,
    };
  }
  if (baseline > 0 && input.currentComplaints > baseline * 2) {
    return {
      anomalyType: "complaint_spike",
      severity: "high",
      description: "Unusual increase in complaints detected compared to the prior period.",
      baselineValue: baseline,
      detectedValue: input.currentComplaints,
    };
  }
  return null;
}
