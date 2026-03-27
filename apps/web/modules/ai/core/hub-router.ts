import { buildBaseSystem } from "./ai-prompts";
import type { AiHub, AiIntent, AiMessages } from "./types";
import { buildBuyerAiMessages, buyerOfflineFallback } from "../buyer/buyer-ai";
import { buildSellerAiMessages, sellerOfflineFallback } from "../seller/seller-ai";
import { buildBnhubAiMessages, bnhubOfflineFallback } from "../bnhub/bnhub-ai";
import { buildRentAiMessages, rentOfflineFallback } from "../bnhub/rent-ai";
import { buildBrokerAiMessages, brokerOfflineFallback } from "../broker/broker-ai";
import { buildMortgageAiMessages, mortgageOfflineFallback } from "../mortgage/mortgage-ai";
import { buildInvestorAiMessages, investorOfflineFallback } from "../investor/investor-ai";
import { buildAdminAiMessages, adminOfflineFallback } from "../admin/admin-ai";

function genericMessages(hub: AiHub, intent: AiIntent, feature: string, context: Record<string, unknown>): AiMessages {
  const system = buildBaseSystem(hub, intent);
  return {
    system,
    user: `Feature: ${feature}\nContext (JSON):\n${JSON.stringify(context, null, 2)}`,
  };
}

export function buildMessagesForHub(
  hub: AiHub,
  intent: AiIntent,
  feature: string,
  context: Record<string, unknown>
): AiMessages {
  let built: AiMessages | null = null;
  switch (hub) {
    case "buyer":
      built = buildBuyerAiMessages(intent, feature, context);
      break;
    case "seller":
      built = buildSellerAiMessages(intent, feature, context);
      break;
    case "bnhub":
      built = buildBnhubAiMessages(intent, feature, context);
      break;
    case "rent":
      built = buildRentAiMessages(intent, feature, context);
      break;
    case "broker":
      built = buildBrokerAiMessages(intent, feature, context);
      break;
    case "mortgage":
      built = buildMortgageAiMessages(intent, feature, context);
      break;
    case "investor":
      built = buildInvestorAiMessages(intent, feature, context);
      break;
    case "admin":
      built = buildAdminAiMessages(intent, feature, context);
      break;
    default:
      built = null;
  }
  return built ?? genericMessages(hub, intent, feature, context);
}

export function offlineTextForHub(hub: AiHub, feature: string, context: Record<string, unknown>): string {
  switch (hub) {
    case "buyer":
      return buyerOfflineFallback(feature, context);
    case "seller":
      return sellerOfflineFallback(feature, context);
    case "bnhub":
      return bnhubOfflineFallback(feature, context);
    case "rent":
      return rentOfflineFallback(feature, context);
    case "broker":
      return brokerOfflineFallback(feature, context);
    case "mortgage":
      return mortgageOfflineFallback(feature, context);
    case "investor":
      return investorOfflineFallback(feature, context);
    case "admin":
      return adminOfflineFallback(feature, context);
    default:
      return `AI is offline. For “${feature}”, review the details in-app and consult a professional when needed.`;
  }
}
