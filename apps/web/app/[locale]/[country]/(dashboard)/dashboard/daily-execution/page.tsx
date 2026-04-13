import { DailyExecutionDashboard } from "@/src/modules/daily-execution/ui/DailyExecutionDashboard";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";

export default async function DailyExecutionPage() {
  await requireAuthenticatedUser();

  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <DailyExecutionDashboard />
      </div>
    </div>
  );
}
