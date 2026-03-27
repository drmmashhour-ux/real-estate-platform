/**
 * Platform GST/QST invoice PDF — server-only via `@react-pdf/renderer`.
 */
import path from "path";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

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
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { width: 40, height: 40 },
  brand: { fontSize: 15, fontFamily: "Helvetica-Bold", color: "#0B0B0B" },
  invNum: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#B8922B", marginTop: 4 },
  meta: { fontSize: 9, color: "#555", marginTop: 6 },
  row: { marginTop: 8, flexDirection: "row", justifyContent: "space-between" },
  label: { color: "#555", width: "42%" },
  value: { width: "56%", textAlign: "right" as const },
  h2: {
    marginTop: 20,
    marginBottom: 6,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    paddingBottom: 4,
  },
  footer: { marginTop: 24, fontSize: 8, color: "#666", lineHeight: 1.35 },
});

function fmtMoney(cents: number | null | undefined, currency: string) {
  if (cents == null) return "—";
  return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

function logoSrc(): string {
  return path.join(process.cwd(), "public", "logo.png");
}

export type PlatformInvoicePdfProps = {
  invoiceNumber: string;
  issuedAt: string;
  status: string;
  currency: string;
  invoiceLabel?: string | null;
  payerEmail?: string | null;
  subtotalCents?: number | null;
  gstCents?: number | null;
  qstCents?: number | null;
  totalCents?: number | null;
  hubSource?: string | null;
};

export function PlatformInvoicePdfDocument({ data }: { data: PlatformInvoicePdfProps }) {
  const cur = data.currency || "cad";
  const sub = data.subtotalCents ?? null;
  const gst = data.gstCents ?? null;
  const qst = data.qstCents ?? null;
  const total = data.totalCents ?? null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <Image src={logoSrc()} style={styles.logo} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.brand}>Platform invoice</Text>
              <Text style={styles.invNum}>{data.invoiceNumber}</Text>
              <Text style={styles.meta}>
                Issued {data.issuedAt} · Status {data.status}
                {data.hubSource ? ` · ${data.hubSource}` : ""}
              </Text>
            </View>
          </View>
        </View>

        {data.invoiceLabel ? (
          <Text style={{ marginTop: 12, fontSize: 10 }}>{data.invoiceLabel}</Text>
        ) : null}

        <Text style={styles.h2}>Bill to</Text>
        <Text style={{ fontSize: 10 }}>{data.payerEmail ?? "—"}</Text>

        <Text style={styles.h2}>Amounts</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Subtotal</Text>
          <Text style={styles.value}>{fmtMoney(sub, cur)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>GST</Text>
          <Text style={styles.value}>{fmtMoney(gst, cur)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>QST</Text>
          <Text style={styles.value}>{fmtMoney(qst, cur)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { fontFamily: "Helvetica-Bold" }]}>Total</Text>
          <Text style={[styles.value, { fontFamily: "Helvetica-Bold" }]}>{fmtMoney(total, cur)}</Text>
        </View>

        <Text style={styles.footer}>
          Operational summary for your records. This is not a government-filed tax return. Retain for your
          accountant.
        </Text>
      </Page>
    </Document>
  );
}
