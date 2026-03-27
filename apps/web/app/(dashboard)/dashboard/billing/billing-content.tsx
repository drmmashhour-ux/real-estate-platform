"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { buildPlatformInvoiceDocumentHtml } from "@/lib/billing/platform-invoice-print-html";

type Invoice = {
  id: string;
  usageId?: string;
  amount: number;
  createdAt: string;
  invoiceNumber: string | null;
};

type UpgradeInvoice = {
  id: string;
  amount: number;
  plan: string;
  date: string;
  createdAt: string;
};

type InvoiceTaxDetails = {
  broker?: {
    legalName: string;
    gstNumber: string | null;
    qstNumber: string | null;
    businessNumberNine: string;
    reviewStatus: string;
  };
  platform?: {
    legalName?: string | null;
    gstNumber?: string | null;
    qstNumber?: string | null;
    note?: string | null;
    taxBreakdown?: {
      currency: string;
      taxMode: string;
      gstRatePercent: number;
      qstRatePercent: number;
      combinedSubtotalCents: number;
      combinedGstCents: number;
      combinedQstCents: number;
      chargedTotalCents: number;
      lines: Array<{
        party: string;
        description: string;
        subtotalCents: number;
        gstCents: number;
        qstCents: number;
        lineTotalCents: number;
        taxApplied: boolean;
      }>;
    } | null;
  };
  disclaimer?: string;
};

type PlatformInvoiceItem = {
  id: string;
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  createdAt: string;
  subtotalCents?: number | null;
  gstCents?: number | null;
  qstCents?: number | null;
  totalCents?: number | null;
  taxMode?: string | null;
  invoiceLines?: unknown;
  invoiceTaxDetails?: InvoiceTaxDetails | null;
  payment: {
    paymentType: string;
    bookingId?: string;
    dealId?: string;
    brokerTaxSnapshot?: unknown;
  };
};

type Usage = {
  id: string;
  listingId: string;
  createdAt: string;
  trialEndsAt: string;
  isPaid: boolean;
  amount: number;
};

export function BillingContent() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [upgradeInvoices, setUpgradeInvoices] = useState<UpgradeInvoice[]>([]);
  const [platformInvoices, setPlatformInvoices] = useState<PlatformInvoiceItem[]>([]);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [inTrial, setInTrial] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [usageRes, billingRes, platformRes] = await Promise.all([
          fetch("/api/canva/usage", { credentials: "same-origin" }),
          fetch("/api/billing/invoices", { credentials: "same-origin" }),
          fetch("/api/billing/platform-invoices", { credentials: "same-origin" }),
        ]);
        const data = await usageRes.json().catch(() => ({}));
        const billing = await billingRes.json().catch(() => ({}));
        const platform = await platformRes.json().catch(() => ({}));
        if (!cancelled) {
          setUsage(data.usage ?? null);
          setInvoices(data.invoices ?? []);
          setTrialEndsAt(data.trialEndsAt ?? null);
          setInTrial(!!data.inTrial);
          setUpgradeInvoices(billing.invoices ?? []);
          setPlatformInvoices(platform.invoices ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handlePay = async () => {
    if (!usage?.id || usage.isPaid) return;
    setPaying(true);
    try {
      const res = await fetch("/api/payment/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usageId: usage.id }),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setUsage((u) => (u ? { ...u, isPaid: true } : null));
        setInvoices((prev) => [
          ...prev,
          {
            id: data.invoiceId,
            usageId: usage.id,
            amount: data.amount,
            createdAt: typeof data.createdAt === "string" ? data.createdAt : new Date(data.createdAt).toISOString(),
            invoiceNumber: data.invoiceNumber ?? null,
          },
        ]);
        setInTrial(false);
      }
    } finally {
      setPaying(false);
    }
  };

  const downloadInvoicePdf = (invoice: Invoice | UpgradeInvoice, label?: string) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(label ?? "Invoice", 10, 20);
    doc.setFontSize(10);
    doc.text(`Invoice ID: ${"invoiceNumber" in invoice ? (invoice.invoiceNumber ?? invoice.id) : invoice.id}`, 10, 32);
    doc.text(`Amount: $${invoice.amount.toFixed(2)}`, 10, 40);
    if ("plan" in invoice) doc.text(`Plan: ${invoice.plan}`, 10, 48);
    doc.text(`Date: ${new Date(("date" in invoice ? invoice.date : invoice.createdAt) ?? invoice.createdAt).toLocaleDateString()}`, 10, "plan" in invoice ? 56 : 48);
    doc.save(`invoice-${invoice.id}.pdf`);
  };

  const printInvoice = (invoice: Invoice | UpgradeInvoice, label?: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const invId = "invoiceNumber" in invoice ? (invoice.invoiceNumber ?? invoice.id) : invoice.id;
    const date = ("date" in invoice ? invoice.date : invoice.createdAt) ?? invoice.createdAt;
    const planLine = "plan" in invoice ? `<p><strong>Plan:</strong> ${invoice.plan}</p>` : "";
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>Invoice ${invId}</title></head>
        <body style="font-family:sans-serif;padding:24px;">
          <h1>${label ?? "Invoice"}</h1>
          <p><strong>Invoice ID:</strong> ${invId}</p>
          <p><strong>Amount:</strong> $${invoice.amount.toFixed(2)}</p>
          ${planLine}
          <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  if (loading) {
    return (
      <div className="mt-6 text-sm text-slate-500 dark:text-slate-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Trial status */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Trial &amp; payment</h2>
        {trialEndsAt ? (
          <>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {inTrial
                ? `Free trial until ${new Date(trialEndsAt).toLocaleDateString()}. No payment needed yet.`
                : usage?.isPaid
                  ? "You’ve paid for Canva access. You can create designs."
                  : `Trial ended on ${new Date(trialEndsAt).toLocaleDateString()}. Pay $${usage?.amount ?? 5} to continue.`}
            </p>
            {usage && !usage.isPaid && (
              <button
                type="button"
                onClick={handlePay}
                disabled={paying}
                className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {paying ? "Processing…" : `Pay $${usage.amount}`}
              </button>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            No Canva usage yet. When you use Canva from a listing, you’ll get a 7-day free trial, then $5 per design.
          </p>
        )}
      </section>

      {/* Platform invoices (bookings, deals, subscriptions) */}
      {platformInvoices.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Invoices (bookings, deals)</h2>
          <ul className="mt-4 space-y-3">
            {platformInvoices.map((inv) => (
              <li
                key={inv.id}
                className="invoice-doc-row dark-invoice flex flex-wrap items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{inv.invoiceNumber}</span>
                  <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                    {(inv.amountCents / 100).toFixed(2)} {inv.currency.toUpperCase()} · {inv.payment.paymentType} · {new Date(inv.createdAt).toLocaleDateString()}
                  </span>
                  {(inv.invoiceTaxDetails?.platform?.legalName ||
                    inv.invoiceTaxDetails?.platform?.gstNumber ||
                    inv.invoiceTaxDetails?.platform?.qstNumber) && (
                    <p className="mt-2 text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">Bill from:</span>{" "}
                      {inv.invoiceTaxDetails?.platform?.legalName ?? "Platform"}
                      {inv.invoiceTaxDetails?.platform?.gstNumber ?
                        ` · GST ${inv.invoiceTaxDetails.platform.gstNumber}`
                      : ""}
                      {inv.invoiceTaxDetails?.platform?.qstNumber ?
                        ` · QST ${inv.invoiceTaxDetails.platform.qstNumber}`
                      : ""}
                    </p>
                  )}
                  {inv.invoiceTaxDetails?.platform?.taxBreakdown && (
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Tax breakdown: GST {(inv.invoiceTaxDetails.platform.taxBreakdown.combinedGstCents / 100).toFixed(2)}{" "}
                      {inv.currency.toUpperCase()} · QST{" "}
                      {(inv.invoiceTaxDetails.platform.taxBreakdown.combinedQstCents / 100).toFixed(2)}{" "}
                      {inv.currency.toUpperCase()} · Total{" "}
                      {(inv.invoiceTaxDetails.platform.taxBreakdown.chargedTotalCents / 100).toFixed(2)}{" "}
                      {inv.currency.toUpperCase()}
                    </p>
                  )}
                  {inv.invoiceTaxDetails?.broker && (
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Related broker tax (on file):</span>{" "}
                      {inv.invoiceTaxDetails.broker.legalName}
                      {inv.invoiceTaxDetails.broker.gstNumber ? ` · GST ${inv.invoiceTaxDetails.broker.gstNumber}` : ""}
                      {inv.invoiceTaxDetails.broker.qstNumber ? ` · QST ${inv.invoiceTaxDetails.broker.qstNumber}` : ""}
                      {` · BN ${inv.invoiceTaxDetails.broker.businessNumberNine}`} · Review:{" "}
                      {inv.invoiceTaxDetails.broker.reviewStatus}
                    </p>
                  )}
                  {inv.invoiceTaxDetails?.platform?.note && (
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Note:</span> {inv.invoiceTaxDetails.platform.note}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-500">
                    Tax numbers are provided by the broker; the platform does not guarantee validity with Revenu Québec or the CRA.
                  </p>
                </div>
                <a
                  href={`/api/invoices/${inv.id}/download`}
                  className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  PDF
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const doc = window.open("", "_blank");
                    if (!doc) return;
                    doc.document.write(
                      buildPlatformInvoiceDocumentHtml({
                        invoiceNumber: inv.invoiceNumber,
                        amountCents: inv.amountCents,
                        currency: inv.currency,
                        createdAt: inv.createdAt,
                        payment: inv.payment,
                        subtotalCents: inv.subtotalCents,
                        gstCents: inv.gstCents,
                        qstCents: inv.qstCents,
                        totalCents: inv.totalCents,
                        taxMode: inv.taxMode,
                        invoiceLines: inv.invoiceLines,
                        invoiceTaxDetails: inv.invoiceTaxDetails ?? null,
                      })
                    );
                    doc.document.close();
                    doc.print();
                    doc.close();
                  }}
                  className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Print
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Payment history / Upgrade invoices (Design Access $5, storage plans) */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Payment history</h2>
        {upgradeInvoices.length === 0 && invoices.length === 0 && platformInvoices.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No invoices yet. Platform invoices (bookings, deals) appear above when available.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {upgradeInvoices.map((inv) => (
              <li
                key={inv.id}
                className="invoice-doc-row dark-invoice flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {inv.plan === "design-access" ? "Design Access" : inv.plan}
                  </span>
                  <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                    ${inv.amount.toFixed(2)} · {new Date(inv.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => downloadInvoicePdf(inv, "Design Studio – Invoice")}
                    className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Download PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => printInvoice(inv, "Design Studio – Invoice")}
                    className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Print
                  </button>
                </div>
              </li>
            ))}
            {invoices.map((inv) => (
              <li
                key={inv.id}
                className="invoice-doc-row dark-invoice flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {inv.invoiceNumber ?? inv.id}
                  </span>
                  <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                    ${inv.amount.toFixed(2)} · {new Date(inv.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => downloadInvoicePdf(inv, "Canva Design – Invoice")}
                    className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Download PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => printInvoice(inv, "Canva Design – Invoice")}
                    className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Print
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
