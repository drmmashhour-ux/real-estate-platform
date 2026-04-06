import { StyleSheet, Text, View } from "react-native";
import type { ListingReviewRow } from "../types/review";
import { colors } from "../theme/colors";

const DEFAULT_PREVIEW = 3;

function truncate(s: string, max: number) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

type Props = {
  listingId: string;
  /** Precomputed from platform API (`/api/bnhub/public/listings/[id]`). */
  averageRating: number | null;
  reviewCount: number;
  /** Server-provided preview rows — no direct Supabase reads in the app. */
  previewRows: ListingReviewRow[];
  maxPreview?: number;
};

/**
 * Read-only reviews strip for listing detail. Submit reviews from booking details after a paid stay (POST `/api/reviews/create`).
 */
export function PropertyReviewsSection({
  averageRating,
  reviewCount,
  previewRows,
  maxPreview = DEFAULT_PREVIEW,
}: Props) {
  const rows = previewRows.slice(0, maxPreview);
  const showList = rows.length > 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Reviews</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.stars}>{averageRating != null ? `${averageRating.toFixed(1)} ★` : "— ★"}</Text>
        <Text style={styles.countMeta}>
          {reviewCount > 0
            ? `${reviewCount} review${reviewCount === 1 ? "" : "s"}`
            : "No reviews yet"}
        </Text>
      </View>
      {showList ? (
        <View style={styles.list}>
          {rows.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.ratingBadge}>{r.rating.toFixed(1)} ★</Text>
                <Text style={styles.date}>{r.created_at ? r.created_at.slice(0, 10) : ""}</Text>
              </View>
              {r.comment ? <Text style={styles.comment}>{truncate(r.comment, 220)}</Text> : null}
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.hint}>No written reviews to preview yet.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 10 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  stars: { color: colors.gold, fontSize: 18, fontWeight: "700" },
  countMeta: { color: colors.muted, fontSize: 14 },
  list: { gap: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  ratingBadge: { color: colors.gold, fontWeight: "700" },
  date: { color: colors.muted, fontSize: 12 },
  comment: { color: colors.text, lineHeight: 20, fontSize: 14 },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 20 },
});
