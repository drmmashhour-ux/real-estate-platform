import Link from "next/link";

type BrokerClientCardProps = {
  name: string;
  type: "buyer" | "seller";
  listingCount?: number;
  nextFollowUp?: string;
  accent?: string;
};

export function BrokerClientCard({
  name,
  type,
  listingCount = 0,
  nextFollowUp,
  accent = "#10b981",
}: BrokerClientCardProps) {
  return (
    <div
      className="rounded-lg border p-3"
      style={{
        backgroundColor: "rgba(255,255,255,0.06)",
        borderColor: `${accent}30`,
      }}
    >
      <p className="font-semibold text-sm text-white">{name}</p>
      <p className="mt-0.5 text-xs capitalize" style={{ color: accent }}>
        Active {type}
      </p>
      {listingCount > 0 && (
        <p className="mt-1 text-xs text-slate-400">{listingCount} listing(s)</p>
      )}
      {nextFollowUp && (
        <p className="mt-2 text-xs text-slate-500">Follow-up: {nextFollowUp}</p>
      )}
      <Link
        href="/dashboard/leads"
        className="mt-2 inline-block text-xs font-medium hover:underline"
        style={{ color: accent }}
      >
        View →
      </Link>
    </div>
  );
}
