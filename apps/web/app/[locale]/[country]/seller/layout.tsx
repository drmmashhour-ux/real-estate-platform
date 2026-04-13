import type { ReactNode } from "react";

export default function SellerHubLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#0B0B0B] text-slate-100">{children}</div>;
}
