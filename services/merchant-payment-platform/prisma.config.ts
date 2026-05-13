import { defineConfig } from "prisma/config";

const PRISMA_CLI_PLACEHOLDER =
  "postgresql://nexora:nexora@127.0.0.1:5432/nexora?sslmode=disable";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env["DATABASE_URL"]?.trim() || PRISMA_CLI_PLACEHOLDER,
  },
});
