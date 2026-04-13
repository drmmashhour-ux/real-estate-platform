import { ExpertLeadsClient } from "./expert-leads-client";

export const dynamic = "force-dynamic";

export default function ExpertLeadsPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Mortgage leads</h1>
      <p className="mt-2 text-sm text-[#B3B3B3]">Leads assigned to you from the public mortgage form.</p>
      <ExpertLeadsClient />
    </>
  );
}
