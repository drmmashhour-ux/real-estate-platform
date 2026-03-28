import { launchCity } from "@/src/modules/expansion/launchCity";
import { runDailyAutopilotContent } from "@/src/modules/ai/contentEngine";

export type DeployNewCityResult = Awaited<ReturnType<typeof launchCity>> & {
  autopilotContent: Awaited<ReturnType<typeof runDailyAutopilotContent>>;
};

/**
 * Market expansion: register city (SEO surface + campaigns), then generate autopilot content pack.
 */
export async function deployNewCity(cityName: string): Promise<DeployNewCityResult> {
  const launch = await launchCity(cityName);
  const autopilotContent = await runDailyAutopilotContent({ city: launch.displayName, publish: true });
  return { ...launch, autopilotContent };
}
