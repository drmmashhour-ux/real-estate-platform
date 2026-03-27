import { prisma } from "@/lib/db";
import { getGrowthConnectorAdapter } from "../connectors/registry";
import { parseCapabilities } from "../connectors/types";

export async function listConnectors() {
  return prisma.bnhubGrowthConnector.findMany({ orderBy: { connectorCode: "asc" } });
}

export async function getConnectorByCode(code: string) {
  return prisma.bnhubGrowthConnector.findUnique({ where: { connectorCode: code } });
}

export function resolveConnectorAdapter(code: string) {
  return getGrowthConnectorAdapter(code);
}

export async function validateConnectorSetup(code: string) {
  const adapter = getGrowthConnectorAdapter(code);
  if (!adapter) return { ok: false as const, message: "Unknown connector" };
  return adapter.validateSetup();
}

export async function runConnectorHealthcheck(code: string) {
  const adapter = getGrowthConnectorAdapter(code);
  if (!adapter) return { ok: false as const, message: "Unknown connector" };
  const row = await prisma.bnhubGrowthConnector.findUnique({ where: { connectorCode: code } });
  const h = await adapter.healthCheck();
  if (row) {
    await prisma.bnhubGrowthConnector.update({
      where: { id: row.id },
      data: {
        lastHealthcheckAt: new Date(),
        status: h.ok ? "ACTIVE" : "SETUP_REQUIRED",
      },
    });
  }
  return h;
}

export async function syncConnectorMetricsForDistribution(distributionId: string) {
  const dist = await prisma.bnhubGrowthDistribution.findUnique({
    where: { id: distributionId },
    include: { connector: true },
  });
  if (!dist) return { ok: false as const, summary: "Distribution not found" };
  const adapter = getGrowthConnectorAdapter(dist.connector.connectorCode);
  if (!adapter?.syncMetrics) return { ok: false as const, summary: "No syncMetrics for connector" };
  return adapter.syncMetrics(distributionId);
}

export function getConnectorCapabilitiesJson(code: string) {
  const adapter = getGrowthConnectorAdapter(code);
  return adapter?.getCapabilities() ?? {};
}

export { parseCapabilities };
