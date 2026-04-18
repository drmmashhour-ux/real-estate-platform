import type { OfficeInvoiceType } from "@prisma/client";

export type CreateOfficeInvoiceInput = {
  officeId: string;
  brokerUserId?: string | null;
  dealId?: string | null;
  invoiceType: OfficeInvoiceType;
  lines: Array<{
    lineType: import("@prisma/client").OfficeInvoiceLineType;
    description: string;
    quantity: number;
    unitAmountCents: number;
    totalAmountCents: number;
  }>;
};
