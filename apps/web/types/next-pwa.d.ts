declare module "next-pwa" {
  import type { NextConfig } from "next";

  type PWAConfig = {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    scope?: string;
    [key: string]: unknown;
  };

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;
  export default withPWA;
}
