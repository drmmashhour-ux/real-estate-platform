/**
 * Knowledge graph monitoring — never throws.
 */

const LOG_PREFIX = "[growth:knowledge-graph]";

export type GrowthKnowledgeGraphMonitoringState = {
  graphBuilds: number;
  nodesBuilt: number;
  edgesBuilt: number;
  blockerClustersFound: number;
  winnerClustersFound: number;
  conflictPairsFound: number;
  missingDataWarnings: number;
};

let state: GrowthKnowledgeGraphMonitoringState = {
  graphBuilds: 0,
  nodesBuilt: 0,
  edgesBuilt: 0,
  blockerClustersFound: 0,
  winnerClustersFound: 0,
  conflictPairsFound: 0,
  missingDataWarnings: 0,
};

export function getGrowthKnowledgeGraphMonitoringSnapshot(): GrowthKnowledgeGraphMonitoringState {
  return { ...state };
}

export function resetGrowthKnowledgeGraphMonitoringForTests(): void {
  state = {
    graphBuilds: 0,
    nodesBuilt: 0,
    edgesBuilt: 0,
    blockerClustersFound: 0,
    winnerClustersFound: 0,
    conflictPairsFound: 0,
    missingDataWarnings: 0,
  };
}

export function logGrowthKnowledgeGraphBuildStarted(): void {
  try {
    console.info(`${LOG_PREFIX} build started`);
  } catch {
    /* noop */
  }
}

export function recordGrowthKnowledgeGraphBuild(args: {
  nodeCount: number;
  edgeCount: number;
  blockerClusterSize: number;
  winnerClusterSize: number;
  conflictPairs: number;
  topThemes: string[];
  missingDataWarningCount: number;
}): void {
  try {
    state.graphBuilds += 1;
    state.nodesBuilt += args.nodeCount;
    state.edgesBuilt += args.edgeCount;
    state.blockerClustersFound += args.blockerClusterSize >= 2 ? 1 : 0;
    state.winnerClustersFound += args.winnerClusterSize >= 2 ? 1 : 0;
    state.conflictPairsFound += args.conflictPairs;
    state.missingDataWarnings += args.missingDataWarningCount;
    console.info(
      `${LOG_PREFIX} build completed nodes=${args.nodeCount} edges=${args.edgeCount} themes=${args.topThemes
        .slice(0, 4)
        .join("|")} warnings=${args.missingDataWarningCount}`,
    );
  } catch {
    /* noop */
  }
}
