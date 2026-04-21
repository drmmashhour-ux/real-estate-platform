import {
  CONTRACTOR_WORK_DISCLAIMER,
  matchContractorsForUpgrades,
  createGreenQuoteRequest,
} from "@/modules/contractors/contractor.service";
import { contractorPipelineLog } from "./pipeline-logger";

export { CONTRACTOR_WORK_DISCLAIMER };

/**
 * Contractor matching with pipeline-scoped structured logging `[contractor]`.
 */
export async function matchContractorsForPipeline(args: Parameters<typeof matchContractorsForUpgrades>[0]) {
  contractorPipelineLog.info("match_start", {
    upgrades: args.upgradeRecommendations?.length ?? 0,
    region: args.region ?? null,
  });
  try {
    const result = await matchContractorsForUpgrades(args);
    contractorPipelineLog.info("match_complete", {
      matched: result.contractors.length,
      tags: result.wantedTags?.length ?? 0,
    });
    return result;
  } catch (e) {
    contractorPipelineLog.error("match_failed", {
      message: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }
}

export async function submitGreenQuoteRequestViaPipeline(args: Parameters<typeof createGreenQuoteRequest>[0]) {
  contractorPipelineLog.info("quote_request_create", {
    contractorId: args.contractorId ?? null,
    region: args.region ?? null,
    hints: args.upgradeHints.length,
  });
  return createGreenQuoteRequest(args);
}
