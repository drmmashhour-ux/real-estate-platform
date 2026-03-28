import { prisma } from "@/lib/db";
import { BUILTIN_COUNTRY_DEFAULTS } from "@/src/modules/global/countries";
import { runDailyAutopilotContent } from "@/src/modules/ai/contentEngine";

const globalCountryConfig = (prisma as unknown as { globalCountryConfig?: unknown }).globalCountryConfig as
  | {
      findUnique: (args: object) => Promise<unknown>;
      upsert: (args: object) => Promise<unknown>;
      update: (args: object) => Promise<unknown>;
    }
  | undefined;

export type LaunchCountryResult = {
  countryCode: string;
  displayName: string;
  defaultCurrency: string;
  defaultLocale: string;
  alreadyExisted: boolean;
  pagesDeployed: string[];
  seoActivated: boolean;
  contentDeployed: boolean;
};

/**
 * Country-level expansion: config row, SEO flags, page list, optional autopilot content pack.
 */
export async function launchCountry(
  countryCode: string,
  options?: { seedCityForContent?: string }
): Promise<LaunchCountryResult> {
  const code = countryCode.trim().toUpperCase().slice(0, 2);
  const built = BUILTIN_COUNTRY_DEFAULTS[code] ?? {
    displayName: code,
    defaultCurrency: "usd",
    defaultLocale: "en-US",
    regionPricingMultiplier: 1,
  };

  const pagesDeployed = [
    `/bnhub/stays?country=${code}`,
    `/search/bnhub`,
    `/market`,
    `/glob/${code.toLowerCase()}`,
  ];

  if (!globalCountryConfig) {
    let contentDeployed = false;
    const city =
      options?.seedCityForContent ??
      (code === "CA" ? "Montreal" : code === "US" ? "New York" : code === "FR" ? "Paris" : built.displayName);
    try {
      await runDailyAutopilotContent({ city, publish: true });
      contentDeployed = true;
    } catch {
      /* optional */
    }
    return {
      countryCode: code,
      displayName: built.displayName,
      defaultCurrency: built.defaultCurrency,
      defaultLocale: built.defaultLocale,
      alreadyExisted: false,
      pagesDeployed,
      seoActivated: false,
      contentDeployed,
    };
  }

  const existing = await globalCountryConfig.findUnique({ where: { countryCode: code } });

  await globalCountryConfig.upsert({
    where: { countryCode: code },
    create: {
      countryCode: code,
      displayName: built.displayName,
      defaultCurrency: built.defaultCurrency,
      defaultLocale: built.defaultLocale,
      regionPricingMultiplier: built.regionPricingMultiplier,
      seoActivated: true,
      pagesDeployed,
      contentDeployed: false,
      launchedAt: new Date(),
      active: true,
    },
    update: {
      seoActivated: true,
      pagesDeployed,
      launchedAt: new Date(),
      active: true,
    },
  });

  let contentDeployed = false;
  const city =
    options?.seedCityForContent ??
    (code === "CA" ? "Montreal" : code === "US" ? "New York" : code === "FR" ? "Paris" : built.displayName);
  try {
    await runDailyAutopilotContent({ city, publish: true });
    contentDeployed = true;
    await globalCountryConfig.update({
      where: { countryCode: code },
      data: { contentDeployed: true },
    });
  } catch {
    // OpenAI / DB optional — country row still valid
  }

  return {
    countryCode: code,
    displayName: built.displayName,
    defaultCurrency: built.defaultCurrency,
    defaultLocale: built.defaultLocale,
    alreadyExisted: Boolean(existing),
    pagesDeployed,
    seoActivated: true,
    contentDeployed,
  };
}
