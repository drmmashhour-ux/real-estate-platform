function parseTruthy(raw: string | undefined): boolean {
  if (raw == null || raw === "") return false;
  const v = raw.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "on";
}

export function isCopilotEnabled(): boolean {
  return parseTruthy(process.env.COPILOT_ENABLED);
}

export function isCopilotInvestorEnabled(): boolean {
  return isCopilotEnabled() && parseTruthy(process.env.COPILOT_INVESTOR_ENABLED ?? "true");
}

export function isCopilotBrokerEnabled(): boolean {
  return isCopilotEnabled() && parseTruthy(process.env.COPILOT_BROKER_ENABLED ?? "true");
}

export function isCopilotSellerEnabled(): boolean {
  return isCopilotEnabled() && parseTruthy(process.env.COPILOT_SELLER_ENABLED ?? "true");
}

export function isCopilotPortfolioEnabled(): boolean {
  return isCopilotEnabled() && parseTruthy(process.env.COPILOT_PORTFOLIO_ENABLED ?? "true");
}
