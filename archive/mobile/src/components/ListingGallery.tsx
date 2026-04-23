import { useMemo, useState } from "react";
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { colors } from "../theme/colors";

export type ListingGalleryProps = {
  title: string;
  /** Flat list of image URLs (cover first when known). Overrides cover/extra when non-empty. */
  imageUrls?: string[] | null;
  coverUrl?: string | null;
  extraUrls?: string[];
  onOpenMap?: () => void;
  /** Edge-to-edge width (full window); fixed height hero for property detail. */
  fullBleed?: boolean;
  /** When set with `fullBleed`, image height in px (default 240). */
  fixedHeight?: number;
};

function uniqUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    const t = u.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/**
 * Listing media: horizontal paged carousel when multiple images; placeholder when none.
 */
export function ListingGallery({
  title,
  imageUrls,
  coverUrl,
  extraUrls,
  onOpenMap,
  fullBleed = false,
  fixedHeight = 240,
}: ListingGalleryProps) {
  const { width: windowW } = useWindowDimensions();
  const [layoutW, setLayoutW] = useState(0);
  const [page, setPage] = useState(0);

  const slideW = fullBleed ? windowW : Math.max(layoutW, 1);

  const slides = useMemo(() => {
    const fromProp = (imageUrls ?? []).map((u) => String(u).trim()).filter(Boolean);
    if (fromProp.length > 0) return uniqUrls(fromProp);
    const hero = coverUrl?.trim() || "";
    const rest = (extraUrls ?? []).map((u) => String(u).trim()).filter(Boolean);
    return uniqUrls([hero, ...rest].filter(Boolean));
  }, [imageUrls, coverUrl, extraUrls]);

  const onScrollMomentum = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / Math.max(slideW, 1));
    setPage(Math.max(0, Math.min(i, slides.length - 1)));
  };

  const slideStyle = fullBleed
    ? [styles.slideFixed, { width: slideW, height: fixedHeight }]
    : [styles.slide, { width: slideW }];

  if (slides.length === 0) {
    return (
      <View style={[styles.wrap, fullBleed && styles.wrapBleed]}>
        <View style={[styles.heroPlaceholder, fullBleed && { width: windowW, height: fixedHeight }]}>
          <Text style={styles.placeholderKicker}>BNHUB</Text>
          <Text style={styles.placeholderTitle}>Photo coming soon</Text>
          <Text style={styles.placeholderSub}>Images appear when the host adds a cover and gallery.</Text>
        </View>
        {onOpenMap ? (
          <Pressable onPress={onOpenMap} style={({ pressed }) => [styles.mapChip, pressed && styles.mapChipPressed]}>
            <Text style={styles.mapChipLabel}>Map & area (beta)</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, fullBleed && styles.wrapBleed]}>
      <View
        style={[styles.carouselOuter, fullBleed && styles.carouselOuterBleed]}
        onLayout={(e) => {
          if (!fullBleed) {
            const w = e.nativeEvent.layout.width;
            if (w > 0) setLayoutW(w);
          }
        }}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={slideW}
          snapToAlignment="start"
          onMomentumScrollEnd={onScrollMomentum}
        >
          {slides.map((uri, i) => (
            <Image
              key={`${uri}-${i}`}
              source={{ uri }}
              style={slideStyle}
              resizeMode="cover"
              accessibilityLabel={`${title} photo ${i + 1} of ${slides.length}`}
            />
          ))}
        </ScrollView>
        {slides.length > 1 ? (
          <View style={styles.dots}>
            {slides.map((_, i) => (
              <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
            ))}
          </View>
        ) : null}
      </View>

      {slides.length > 1 ? (
        <Text style={[styles.carouselHint, fullBleed && styles.carouselHintBleed]}>
          {page + 1} / {slides.length} · swipe for more
        </Text>
      ) : null}

      {onOpenMap ? (
        <Pressable
          onPress={onOpenMap}
          style={({ pressed }) => [styles.mapChip, fullBleed && styles.mapChipBleed, pressed && styles.mapChipPressed]}
        >
          <Text style={styles.mapChipLabel}>Map & area (beta)</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  wrapBleed: { marginBottom: 16 },
  carouselOuter: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  carouselOuterBleed: {
    borderRadius: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  slide: {
    aspectRatio: 16 / 10,
    backgroundColor: colors.surface2,
  },
  slideFixed: {
    backgroundColor: colors.surface2,
  },
  dots: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotActive: { backgroundColor: colors.gold, width: 14 },
  carouselHint: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  carouselHintBleed: {
    paddingHorizontal: 20,
    textAlign: "left",
  },
  heroPlaceholder: {
    width: "100%",
    aspectRatio: 16 / 10,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  placeholderKicker: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 8,
  },
  placeholderTitle: { color: colors.gold, fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  placeholderSub: { color: colors.muted, fontSize: 13, lineHeight: 18, textAlign: "center" },
  mapChip: {
    alignSelf: "flex-start",
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  mapChipBleed: {
    marginLeft: 20,
    marginTop: 12,
  },
  mapChipPressed: { opacity: 0.88 },
  mapChipLabel: { color: colors.gold, fontWeight: "700", fontSize: 13 },
});
