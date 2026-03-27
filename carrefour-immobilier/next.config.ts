import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcrypt", "jsonwebtoken"],
};

export default nextConfig;
