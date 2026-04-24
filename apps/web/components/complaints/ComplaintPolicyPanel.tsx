"use client";

export type PolicyChipStatus = "ok" | "missing" | "review_required";

export type ComplaintPolicyPanelProps = {
  writtenPolicy: PolicyChipStatus;
  targetTimelines: PolicyChipStatus;
  fairnessStandards: PolicyChipStatus;
  capaProcess: PolicyChipStatus;
  preventionControls: PolicyChipStatus;
  escalationProcess: PolicyChipStatus;
};

function Chip({ label, status }: { label: string; status: PolicyChipStatus }) {
  const styles =
    status === "ok"
      ? "border-emerald-800 text-emerald-200"
      : status === "missing"
        ? "border-red-800 text-red-200"
        : "border-amber-700 text-amber-200";
  return (
    <div className={`rounded-lg border px-3 py-2 text-xs flex justify-between ${styles}`}>
      <span>{label}</span>
      <span className="uppercase">{status.replace("_", " ")}</span>
    </div>
  );
}

export function ComplaintPolicyPanel(props: ComplaintPolicyPanelProps) {
  return (
    <div className="rounded-xl border border-gray-800 bg-zinc-950 p-4 text-white space-y-2">
      <h3 className="text-sm font-semibold text-[#D4AF37]">Complaint policy health</h3>
      <p className="text-xs text-gray-500">
        Governance controls: written policy, timelines, fairness, CAPA, prevention, and escalation must stay current.
      </p>
      <div className="grid gap-2">
        <Chip label="Written complaint policy" status={props.writtenPolicy} />
        <Chip label="Target timelines" status={props.targetTimelines} />
        <Chip label="Fairness / equity standards" status={props.fairnessStandards} />
        <Chip label="Corrective action process" status={props.capaProcess} />
        <Chip label="Prevention controls" status={props.preventionControls} />
        <Chip label="Escalation process" status={props.escalationProcess} />
      </div>
    </div>
  );
}
