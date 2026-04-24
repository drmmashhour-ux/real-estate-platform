export type CashReceiptForm = {
  receiptId: string;
  date: string;
  agencyOrBrokerName: string;
  agencyOrBrokerAddress: string;

  amount: number;
  currency: "CAD" | "USD" | "OTHER";
  otherCurrencyLabel?: string;

  receivedFor: "deposit" | "advance_on_remuneration" | "advance_on_expenses" | "other";

  receivedMethod: "in_person" | "by_mail" | "armoured_vehicle" | "other";

  relatedTo: "brokerage_contract" | "promise_to_purchase" | "other";

  depositorName: string;
  depositorAddress: string;
  depositorDateOfBirth?: string;
  depositorOccupation?: string;

  signedByName: string;
  signedByLicenseNumber: string;
};
