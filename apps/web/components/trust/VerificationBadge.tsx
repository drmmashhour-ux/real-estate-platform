import { Badge } from "@/components/ui/Badge";

export type VerificationBadgeVariant = "verified" | "high_trust" | "medium" | "low" | "pending";

const copy: Record<VerificationBadgeVariant, { label: string; variant: "success" | "gold" | "warning" | "danger" | "outline" }> = {
  verified: { label: "Verified", variant: "success" },
  high_trust: { label: "High trust", variant: "gold" },
  medium: { label: "Medium trust", variant: "warning" },
  low: { label: "Build trust", variant: "danger" },
  pending: { label: "Pending review", variant: "outline" },
};

export function VerificationBadge({ variant }: { variant: VerificationBadgeVariant }) {
  const c = copy[variant];
  return <Badge variant={c.variant}>{c.label}</Badge>;
}
