import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { isFavoriteListing, toggleFavoriteListing } from "../lib/favorites";
import { colors } from "../theme/colors";

export type PropertyCardProps = {
  listingId: string;
  title: string;
  /** e.g. `$120 / night` */
  priceLabel: string;
  /** e.g. `Montreal, Canada` */
  locationLine?: string | null;
  /** Up to 3 labels; joined with ` • ` */
  featureLabels?: string[];
  coverUrl?: string | null;
  starRating?: number | null;
  reviewCount?: number | null;
  /** Top-left on image when true; otherwise rating pill if `starRating` is set */
  showTopChoice?: boolean;
  /** e.g. `["Verified host","Top host"]` */
  trustTags?: string[];
  onPress?: () => void;
};

function formatStar(r: number): string {
  const x = Math.round(r * 10) / 10;
  return x % 1 === 0 ? String(x) : x.toFixed(1);
}

export default function PropertyCard({
  listingId,
  title,
  priceLabel,
  locationLine,
  featureLabels,
  coverUrl,
  starRating,
  reviewCount,
  showTopChoice = false,
  trustTags,
  onPress,
}: PropertyCardProps) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void isFavoriteListing(listingId).then((v) => {
      if (!cancelled) setFavorite(v);
    });
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  const onHeartPress = useCallback(() => {
    void toggleFavoriteListing(listingId).then(setFavorite);
  }, [listingId]);

  const features = (featureLabels ?? []).filter(Boolean).slice(0, 3);
  const featuresLine = features.length > 0 ? features.join(" • ") : null;
  const trustLine = (trustTags ?? []).filter(Boolean).slice(0, 3).join(" · ");

  const hasRating =
    typeof starRating === "number" && Number.isFinite(starRating) && starRating > 0;
  const ratingMainLine =
    hasRating && starRating != null
      ? `⭐ ${formatStar(starRating)}${typeof reviewCount === "number" && reviewCount > 0 ? ` (${reviewCount})` : ""}`
      : null;

  const showRatingPillOnImage = hasRating && starRating != null && !showTopChoice;

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${priceLabel}`}
      >
        <View style={styles.imageSection}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.image} accessibilityLabel={`${title} photo`} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>BNHub</Text>
            </View>
          )}
          <View style={styles.overlayTopLeft} pointerEvents="none">
            {showTopChoice ? (
              <View style={styles.choiceBadge}>
                <Text style={styles.choiceBadgeText}>Top choice</Text>
              </View>
            ) : showRatingPillOnImage ? (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingBadgeText}>★ {formatStar(starRating)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            {title}
          </Text>
          {locationLine ? <Text style={styles.location}>{locationLine}</Text> : null}
          {trustLine ? <Text style={styles.trustLine}>{trustLine}</Text> : null}
          {featuresLine ? <Text style={styles.features}>{featuresLine}</Text> : null}
          <Text style={styles.price}>{priceLabel}</Text>
          {ratingMainLine ? <Text style={styles.ratingRow}>{ratingMainLine}</Text> : null}
        </View>
      </Pressable>

      <Pressable
        onPress={onHeartPress}
        style={({ pressed }) => [styles.heartBtn, pressed && styles.heartPressed]}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={favorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Text style={[styles.heartIcon, favorite && styles.heartIconFilled]}>{favorite ? "♥" : "♡"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
    position: "relative",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  cardPressed: {
    opacity: 0.96,
  },
  imageSection: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.surface2,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  overlayTopLeft: {
    position: "absolute",
    left: 10,
    top: 10,
    maxWidth: "70%",
  },
  choiceBadge: {
    backgroundColor: "rgba(0,0,0,0.72)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  choiceBadgeText: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  ratingBadge: {
    backgroundColor: "rgba(0,0,0,0.72)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ratingBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  heartBtn: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  heartPressed: {
    opacity: 0.85,
  },
  heartIcon: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "300",
  },
  heartIconFilled: {
    color: colors.gold,
  },
  body: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
  },
  location: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  trustLine: {
    color: colors.goldDim,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 2,
  },
  features: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  price: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  ratingRow: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
});
