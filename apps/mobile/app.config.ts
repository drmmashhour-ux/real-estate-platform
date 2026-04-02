import type { ExpoConfig } from "expo/config";

const productionApiBaseUrl = "https://lecipm.com";
const developmentApiBaseUrl = "http://localhost:3000";

const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  (process.env.APP_VARIANT === "development" ? developmentApiBaseUrl : productionApiBaseUrl);

const config: ExpoConfig = {
  name: "BNHub Guest",
  slug: "bnhub-guest",
  scheme: "bnhubguest",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  plugins: ["expo-router", "expo-notifications", "expo-secure-store"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.lecipm.bnhubguest",
  },
  android: {
    package: "com.lecipm.bnhubguest",
  },
  extra: {
    apiBaseUrl,
  },
};

export default config;
