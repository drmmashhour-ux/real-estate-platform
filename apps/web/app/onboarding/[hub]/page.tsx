import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getHubConfig, HUB_COLORS } from "@/config/hubs";
import { getHubTheme } from "@/lib/hub/themes";
import { hasAcceptedLegalAgreement, getRequiredAgreementType } from "@/lib/hubs/agreements";
import { OnboardingBnhub } from "./OnboardingBnhub";
import { OnboardingBroker } from "./OnboardingBroker";
import { OnboardingProjects } from "./OnboardingProjects";
import { OnboardingLuxury } from "./OnboardingLuxury";
import { LegalAgreementAccept } from "./LegalAgreementAccept";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ hub: string }> };

export default async function OnboardingHubPage({ params }: Props) {
  const userId = await getGuestId();
  if (!userId) redirect("/login");

  const { hub } = await params;
  const hubKey = hub.toLowerCase();
  const config = getHubConfig(hubKey);
  if (!config) notFound();

  const theme = getHubTheme(config.themeKey);
  const agreementType = getRequiredAgreementType(hubKey);
  const accepted = agreementType ? await hasAcceptedLegalAgreement(userId, hubKey, agreementType) : true;

  return (
    <main
      className="min-h-screen text-slate-50"
      style={{ backgroundColor: theme.bg }}
    >
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href={hubKey === "bnhub" ? "/dashboard/bnhub" : `/dashboard/${hubKey === "realestate" ? "real-estate" : hubKey}`}
          className="text-sm opacity-80 hover:opacity-100"
          style={{ color: theme.accent }}
        >
          ← Back to dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold" style={{ color: theme.text }}>
          {hubKey === "bnhub" && "BNHub host onboarding"}
          {hubKey === "realestate" && "Real estate professional onboarding"}
          {hubKey === "broker" && "Broker onboarding"}
          {hubKey === "luxury" && "Luxury hub onboarding"}
          {hubKey === "projects" && "Projects / developer onboarding"}
        </h1>
        <p className="mt-2 text-sm opacity-80" style={{ color: theme.textMuted ?? theme.text }}>
          Complete the steps below. Professional roles must verify and accept legal terms.
        </p>

        {!accepted && agreementType && (
          <LegalAgreementAccept
            userId={userId}
            hub={hubKey}
            agreementType={agreementType}
            accentColor={theme.accent}
          />
        )}

        {accepted && (
          <div className="mt-8 space-y-8">
            {hubKey === "bnhub" && <OnboardingBnhub accentColor={theme.accent} />}
            {(hubKey === "realestate" || hubKey === "broker") && (
              <OnboardingBroker accentColor={theme.accent} />
            )}
            {hubKey === "projects" && <OnboardingProjects accentColor={theme.accent} />}
            {hubKey === "luxury" && <OnboardingLuxury accentColor={theme.accent} />}
          </div>
        )}
      </div>
    </main>
  );
}
