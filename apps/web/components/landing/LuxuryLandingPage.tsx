import LandingNavbar from "./LandingNavbar";
import LandingHero from "./LandingHero";
import LandingSections from "./LandingSections";
import { LandingStandaloneFooter } from "./LandingStandaloneFooter";

export default function LuxuryLandingPage({
  basePath = "",
  standaloneFooter = false,
}: {
  basePath?: string;
  standaloneFooter?: boolean;
}) {
  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      <LandingNavbar basePath={basePath} />
      <main id="main-content" className="flex min-h-[100svh] flex-1 flex-col">
        <LandingHero basePath={basePath} />
        <LandingSections basePath={basePath} />
      </main>
      {standaloneFooter ? (
        <LandingStandaloneFooter basePath={basePath} />
      ) : null}
    </div>
  );
}
