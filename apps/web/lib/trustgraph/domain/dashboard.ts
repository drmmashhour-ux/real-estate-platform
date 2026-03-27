export type WhiteLabelDashboardSafeDto = {
  workspaceId: string;
  workspaceName: string;
  branding: {
    logoUrl: string | null;
    primaryColor: string | null;
    displayLabel: string | null;
  };
  metrics: {
    openCases: number;
    listingsVerifiedPercent: number | null;
    declarationCompletePercent: number | null;
    mortgageReadyPercent: number | null;
    slaOnTrackPercent: number | null;
  };
};
