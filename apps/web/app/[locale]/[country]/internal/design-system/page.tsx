import { notFound } from "next/navigation";

import { DesignSystemShowcase } from "./showcase-client";

export const dynamic = "force-dynamic";

/**
 * Internal LECIPM design system reference. Set `DESIGN_SYSTEM_PAGE=1` in development to view.
 */
export default async function DesignSystemPage() {
  if (process.env.NODE_ENV === "production" && process.env.DESIGN_SYSTEM_PAGE !== "1") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#0B0B0B]">
      <div className="border-b border-[#D9D9D2] bg-white">
        <div className="container max-w-5xl py-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B8921E]">Internal</p>
          <h1 className="mt-2 text-3xl font-semibold">LECIPM design system</h1>
          <p className="mt-2 text-sm text-[#5C5C57]">Component reference for Residence, Management, Admin, and Senior Living Hub.</p>
        </div>
      </div>
      <div className="container max-w-5xl py-10">
        <DesignSystemShowcase />
      </div>
    </div>
  );
}
