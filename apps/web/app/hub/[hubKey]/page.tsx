import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserRole } from "@/lib/auth/session";
import { HubShell } from "@/components/hub/HubShell";
import { HubHero } from "@/components/hub/HubHero";
import { HubSectionCard } from "@/components/hub/HubSectionCard";
import { getHubConfig } from "@/lib/hub/core/hub-registry";
import { resolveHubLabel } from "@/lib/hub/core/hub-i18n";
import { getHubTheme } from "@/lib/hub/themes";

export const dynamic = "force-dynamic";

export default async function HubEnginePage({ params }: { params: Promise<{ hubKey: string }> }) {
  const { hubKey } = await params;
  const hub = getHubConfig(hubKey);
  if (!hub || hub.status === "disabled") notFound();

  if (hub.status === "internal") {
    const role = (await getUserRole()) ?? "";
    const r = role.toUpperCase();
    if (r !== "ADMIN" && r !== "INVESTOR") notFound();
  }

  const title = resolveHubLabel(hub.labelKey);
  const subtitle = resolveHubLabel(hub.descriptionKey);
  const theme = getHubTheme(hub.themeKey);

  return (
    <HubShell>
      <HubHero
        eyebrow="LECIPM Hub Engine"
        title={title}
        subtitle={subtitle}
        actions={
          <Link
            href="/"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/5"
          >
            Home
          </Link>
        }
      />
      <div className="mx-auto mt-10 max-w-5xl px-4 sm:px-6">
        <HubSectionCard title="Hub configuration" theme={theme}>
          <p className="text-sm text-white/75">
            Hub <code className="rounded bg-black/40 px-1 py-0.5">{hub.key}</code> · booking{" "}
            <span className="text-white">{hub.bookingMode}</span> · pricing{" "}
            <span className="text-white">{hub.pricingMode}</span> · messaging{" "}
            <span className="text-white">{hub.messagingMode}</span>
          </p>
          <p className="mt-3 text-xs text-white/50">
            BNHub public SEO routes are unchanged. This shell is for additional verticals registered in the hub engine.
          </p>
        </HubSectionCard>
      </div>
    </HubShell>
  );
}
