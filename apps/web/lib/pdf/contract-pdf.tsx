/**
 * Lease / contract PDF — server-only via `@react-pdf/renderer`.
 */
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
    backgroundColor: "#FAFAFA",
  },
  brand: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#0B0B0B" },
  tag: { marginTop: 2, fontSize: 8, color: "#B8860B" },
  h1: { marginTop: 16, fontSize: 13, fontFamily: "Helvetica-Bold", color: "#0B0B0B" },
  ref: { marginTop: 6, fontSize: 9, color: "#555" },
  body: { marginTop: 14, lineHeight: 1.45 },
  h2: {
    marginTop: 14,
    marginBottom: 4,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#B8860B",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    paddingBottom: 3,
  },
  sigRow: { marginTop: 6, flexDirection: "row", justifyContent: "space-between", fontSize: 8 },
  footer: { marginTop: 20, fontSize: 7, color: "#888", lineHeight: 1.35 },
});

export type ContractPdfProps = {
  title: string;
  reference: string;
  bodyText: string;
  signatures: { role: string; name: string; email: string; signedAt: string | null; ip: string | null }[];
  legalNotice: string;
};

export function ContractPdfDocument({ title, reference, bodyText, signatures, legalNotice }: ContractPdfProps) {
  const chunks = bodyText.split(/\n+/).filter(Boolean);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>LECIPM · Mashhour Investments</Text>
        <Text style={styles.tag}>Residential lease / contract</Text>
        <Text style={styles.h1}>{title}</Text>
        <Text style={styles.ref}>
          Reference: {reference} · PDF generated {new Date().toLocaleString()}
        </Text>
        <View style={styles.body}>
          {chunks.slice(0, 200).map((line, i) => (
            <Text key={i} wrap style={{ marginBottom: 3 }}>
              {line}
            </Text>
          ))}
        </View>
        <Text style={styles.h2}>Signatures</Text>
        {signatures.map((s, i) => (
          <View key={i} wrap={false}>
            <Text style={{ fontSize: 8, marginTop: 4, fontFamily: "Helvetica-Bold" }}>
              {s.role.toUpperCase()} — {s.name}
            </Text>
            <Text style={{ fontSize: 7, color: "#555" }}>{s.email}</Text>
            <Text style={{ fontSize: 7, color: s.signedAt ? "#0a0" : "#a60" }}>
              {s.signedAt ? `Signed: ${s.signedAt}` : "Pending"}
              {s.ip ? ` · IP: ${s.ip}` : ""}
            </Text>
          </View>
        ))}
        <Text style={styles.footer}>{legalNotice}</Text>
      </Page>
    </Document>
  );
}
