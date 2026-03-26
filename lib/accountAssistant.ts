export type AccountState = {
  planName: string;
  planRevision: number;
  balance: number;
};

export type AccountMessageResult = {
  nextState: AccountState;
  reply: string;
};

const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const PLAN_UPDATE_PATTERN =
  /(update|updated|change|changed|renew|renewed|modify|modified).{0,24}plan|plan.{0,24}(update|updated|change|changed|renew|renewed|modify|modified)|\bplann\b/i;

const ADD_MONEY_PATTERN =
  /(add|added|deposit|top\s*up|fund|funded|recharge).{0,24}(money|funds?|wallet|balance|\$)|\badd(ed)?\b.{0,24}\$/i;

const BALANCE_QUERY_PATTERN =
  /\b(balance|total|current|how much|what we have now|what do we have now|now)\b/i;

const FALLBACK_REPLY =
  "I can help with plan updates and wallet funds. Try: 'update my plan and add $100, what is my balance now?'";

function formatUsd(amount: number): string {
  return USD_FORMATTER.format(amount);
}

function extractUsdAmounts(message: string): number {
  const amounts: number[] = [];
  const patterns = [
    /\$\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/g,
    /([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*\$/g,
  ];

  for (const pattern of patterns) {
    for (const match of message.matchAll(pattern)) {
      const numeric = match[1]?.replaceAll(",", "");
      if (!numeric) continue;
      const parsed = Number.parseFloat(numeric);
      if (Number.isFinite(parsed) && parsed > 0) {
        amounts.push(parsed);
      }
    }
  }

  if (amounts.length > 0) {
    return amounts.reduce((sum, value) => sum + value, 0);
  }

  const fallbackNumberMatch = message.match(
    /\b([0-9][0-9,]*(?:\.[0-9]{1,2})?)\b/
  );
  if (!fallbackNumberMatch) {
    return 0;
  }

  const fallbackParsed = Number.parseFloat(
    fallbackNumberMatch[1].replaceAll(",", "")
  );
  if (!Number.isFinite(fallbackParsed) || fallbackParsed <= 0) {
    return 0;
  }

  return fallbackParsed;
}

export function processAccountMessage(
  message: string,
  state: AccountState
): AccountMessageResult {
  const normalizedMessage = message.trim();
  if (!normalizedMessage) {
    return { nextState: state, reply: FALLBACK_REPLY };
  }

  const nextState: AccountState = { ...state };
  const actions: string[] = [];

  const isPlanUpdate = PLAN_UPDATE_PATTERN.test(normalizedMessage);
  const isAddMoney = ADD_MONEY_PATTERN.test(normalizedMessage);
  const isBalanceQuery = BALANCE_QUERY_PATTERN.test(normalizedMessage);

  if (isPlanUpdate) {
    nextState.planRevision += 1;
    actions.push(`Plan updated (v${nextState.planRevision})`);
  }

  if (isAddMoney) {
    const amount = extractUsdAmounts(normalizedMessage);
    if (amount > 0) {
      nextState.balance += amount;
      actions.push(`Added ${formatUsd(amount)}`);
    } else {
      actions.push("Money add requested, but no valid amount was found");
    }
  }

  if (actions.length === 0 && isBalanceQuery) {
    return {
      nextState,
      reply: `Current balance: ${formatUsd(nextState.balance)}.`,
    };
  }

  if (actions.length === 0) {
    return { nextState, reply: FALLBACK_REPLY };
  }

  const summary = actions.join(". ");
  if (isBalanceQuery || isAddMoney) {
    return {
      nextState,
      reply: `${summary}. Current balance: ${formatUsd(nextState.balance)}.`,
    };
  }

  return { nextState, reply: `${summary}.` };
}
