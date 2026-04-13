import { ExpertFinancialHome } from "./expert-financial-home";
import { ExpertProfileClient } from "./expert-profile-client";
import { ExpertPlanOverview } from "./expert-plan-overview";

export const dynamic = "force-dynamic";

export default function ExpertProfilePage() {
  return (
    <>
      <ExpertFinancialHome />
      <ExpertPlanOverview />
      <h1 className="mt-2 text-2xl font-bold text-white">Public profile</h1>
      <p className="mt-2 text-sm text-slate-400">
        Shown on the mortgage hub when your account is <strong className="text-slate-200">verified</strong> and{" "}
        <strong className="text-slate-200">active</strong>. Update photo and bio anytime after approval.
      </p>
      <ExpertProfileClient />
    </>
  );
}
