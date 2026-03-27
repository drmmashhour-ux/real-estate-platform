export type GenerateCanvaInvoiceInput = {
  userId: string;
  usageId: string;
  amount: number;
};

export function generateCanvaInvoice(data: GenerateCanvaInvoiceInput) {
  return {
    id: "INV-" + Date.now(),
    amount: data.amount,
    date: new Date(),
    userId: data.userId,
    usageId: data.usageId,
  };
}

/** Simple invoice data object for design-access / upgrade payments (e.g. for PDF or display). */
export type UpgradeInvoiceData = {
  id: string;
  userId: string;
  amount: number;
  plan: string;
  date: Date;
  pdfUrl?: string | null;
};

export function generateUpgradeInvoiceData(data: Omit<UpgradeInvoiceData, "date"> & { date?: Date }): UpgradeInvoiceData {
  return {
    ...data,
    date: data.date ?? new Date(),
  };
}
