import { HostFinanceClient } from "./HostFinanceClient";

export const metadata = {
  title: "Financial Hub | BNHub Host",
  description: "Monitor earnings, payouts, and transaction history.",
};

export default function HostFinancePage() {
  return <HostFinanceClient />;
}
