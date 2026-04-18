"use client";

/** Placeholder for e-sign integration — broker-initiated only in production. */
export function SignatureBlock({
  label,
  signerRole,
}: {
  label: string;
  signerRole: "buyer" | "seller" | "broker";
}) {
  return (
    <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-950/10 p-4 text-sm text-amber-100/90">
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-xs text-amber-100/70">
        Signature capture for <strong>{signerRole}</strong> is broker-controlled. Connect your official signing workflow —
        LECIPM stores references only unless configured otherwise.
      </p>
    </div>
  );
}
