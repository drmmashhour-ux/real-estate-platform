export function DocumentApprovalTimeline({
  steps,
}: {
  steps: { stepKind: string; status: string }[];
}) {
  return (
    <ol className="relative border-s border-neutral-200 ps-4 dark:border-neutral-800">
      {steps.map((s, i) => (
        <li key={i} className="mb-4">
          <span className="font-medium">{s.stepKind}</span>
          <span className="ml-2 text-sm text-neutral-500">{s.status}</span>
        </li>
      ))}
    </ol>
  );
}
