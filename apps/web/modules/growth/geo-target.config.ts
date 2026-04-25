export type CityConfig = {
  name: string;
  isPrimaryMarket: boolean;
  province: "QC" | "ON" | "BC";
  language: ("FR" | "EN")[];
  pricingMultiplier: number;
};

export const CITIES: Record<string, CityConfig> = {
  "Montreal": {
    name: "Montreal",
    isPrimaryMarket: true,
    province: "QC",
    language: ["FR", "EN"],
    pricingMultiplier: 1.0,
  },
  "Laval": {
    name: "Laval",
    isPrimaryMarket: false,
    province: "QC",
    language: ["FR"],
    pricingMultiplier: 0.9,
  },
  "Longueuil": {
    name: "Longueuil",
    isPrimaryMarket: false,
    province: "QC",
    language: ["FR"],
    pricingMultiplier: 0.9,
  },
  "Quebec City": {
    name: "Quebec City",
    isPrimaryMarket: false,
    province: "QC",
    language: ["FR"],
    pricingMultiplier: 0.85,
  },
  "Gatineau": {
    name: "Gatineau",
    isPrimaryMarket: false,
    province: "QC",
    language: ["FR", "EN"],
    pricingMultiplier: 0.85,
  },
  "Toronto": {
    name: "Toronto",
    isPrimaryMarket: false,
    province: "ON",
    language: ["EN"],
    pricingMultiplier: 1.2,
  },
  "Vancouver": {
    name: "Vancouver",
    isPrimaryMarket: false,
    province: "BC",
    language: ["EN"],
    pricingMultiplier: 1.3,
  },
};

export const TARGET_REGIONS = Object.keys(CITIES);

export const QUEBEC_PRIORITY_CITIES = [
  "Montreal",
  "Laval",
  "Quebec City"
];

export function getTargetRegions() {
  return TARGET_REGIONS;
}

export function isPriorityRegion(city: string) {
  return QUEBEC_PRIORITY_CITIES.some(c => city.toLowerCase().includes(c.toLowerCase()));
}

export function getCityConfig(city: string): CityConfig | undefined {
  return CITIES[city];
}
