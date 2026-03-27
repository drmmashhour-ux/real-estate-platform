/**
 * BNHub invoice PDF — server-only via `@react-pdf/renderer`.
 * Guest rows: total paid only. Host/admin: platform fee + host payout.
 */
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { resolvePublicAssetPath } from "@/lib/pdf/resolve-public-asset";
import type { BookingInvoiceJson } from "@/lib/bnhub/booking-invoice";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
    backgroundColor: "#FAFAFA",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  logo: { width: 44, height: 44 },
  brandBlock: { flex: 1, marginLeft: 12 },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0B0B0B" },
  tag: { marginTop: 2, fontSize: 9, color: "#666" },
  metaRight: { alignItems: "flex-end" },
  invLabel: { fontSize: 8, color: "#888", textTransform: "uppercase" as const },
  invNum: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#B8922B", marginTop: 2 },
  issued: { fontSize: 9, color: "#555", marginTop: 6 },
  codeBox: {
    marginTop: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: "#C9A646",
    backgroundColor: "#FFFCF2",
  },
  codeLabel: { fontSize: 9, color: "#666", textTransform: "uppercase" as const },
  code: { marginTop: 6, fontSize: 22, fontFamily: "Helvetica-Bold", color: "#0B0B0B", letterSpacing: 2 },
  h2: {
    marginTop: 22,
    marginBottom: 6,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#B8922B",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    paddingBottom: 4,
  },
  row: { marginTop: 6, flexDirection: "row", justifyContent: "space-between" },
  label: { color: "#555", width: "40%" },
  value: { width: "58%", textAlign: "right" as const },
  footer: { marginTop: 28, fontSize: 8, color: "#888", lineHeight: 1.4 },
});

function fmtMoney(cents: number | null | undefined) {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function logoSrc(): string {
  return resolvePublicAssetPath("logo.png");
}

export function BnhubInvoicePdfDocument({ data }: { data: BookingInvoiceJson }) {
  const checkIn = fmtDate(data.checkIn);
  const checkOut = fmtDate(data.checkOut);
  const issued = fmtDate(data.date);
  const showSettlement =
    data.platformFeeCents != null && data.hostPayoutCents != null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image style={styles.logo} src={logoSrc()} />
            <View style={styles.brandBlock}>
              <Text style={styles.brand}>LECIPM</Text>
              <Text style={styles.tag}>BNHub · Booking confirmation & invoice</Text>
            </View>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.invLabel}>Invoice no.</Text>
            <Text style={styles.invNum}>{data.invoiceNumber}</Text>
            <Text style={styles.issued}>Issue date · {issued}</Text>
          </View>
        </View>

        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Confirmation code</Text>
          <Text style={styles.code}>{data.confirmationCode ?? "—"}</Text>
        </View>

        <Text style={styles.h2}>Guest</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Guest name</Text>
          <Text style={styles.value}>{data.guestName ?? "—"}</Text>
        </View>

        <Text style={styles.h2}>Listing</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Property</Text>
          <Text style={styles.value}>{data.listingTitle}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Booking ID</Text>
          <Text style={styles.value}>{data.bookingId}</Text>
        </View>

        <Text style={styles.h2}>Stay details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Check-in</Text>
          <Text style={styles.value}>{checkIn}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Check-out</Text>
          <Text style={styles.value}>{checkOut}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Nights</Text>
          <Text style={styles.value}>{String(data.nights)}</Text>
        </View>

        <Text style={styles.h2}>Payment summary</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Total paid (guest)</Text>
          <Text style={styles.value}>{fmtMoney(data.totalAmountCents)}</Text>
        </View>
        {showSettlement ? (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Platform fee</Text>
              <Text style={styles.value}>{fmtMoney(data.platformFeeCents)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Host payout</Text>
              <Text style={styles.value}>{fmtMoney(data.hostPayoutCents)}</Text>
            </View>
          </>
        ) : null}
        <View style={styles.row}>
          <Text style={styles.label}>Payment status</Text>
          <Text style={styles.value}>{data.paymentStatus}</Text>
        </View>

        {data.stripeSessionId || data.paymentIntentId ? (
          <>
            <Text style={styles.h2}>Stripe references</Text>
            {data.stripeSessionId ? (
              <View style={styles.row}>
                <Text style={styles.label}>Checkout session</Text>
                <Text style={styles.value}>{data.stripeSessionId}</Text>
              </View>
            ) : null}
            {data.paymentIntentId ? (
              <View style={styles.row}>
                <Text style={styles.label}>Payment intent</Text>
                <Text style={styles.value}>{data.paymentIntentId}</Text>
              </View>
            ) : null}
          </>
        ) : null}

        <Text style={styles.footer}>
          LECIPM — BNHub. This document reflects your booking payment. Card receipts may
          also be available from Stripe. For support, use the confirmation code when contacting us.
        </Text>
      </Page>
    </Document>
  );
}
