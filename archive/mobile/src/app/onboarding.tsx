import { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";

const GOLD = "#D4AF37";
const MUTED = "#9CA3AF";
const { width: SCREEN_W } = Dimensions.get("window");

const SLIDES: { key: string; title: string; subtitle: string; image: number }[] = [
  {
    key: "1",
    title: "Find the right property faster",
    subtitle: "AI-powered search for smarter decisions",
    image: require("../../assets/onboarding/screen-1-hero.png"),
  },
  {
    key: "2",
    title: "Advanced property search",
    subtitle: "Filters, map, and smart results",
    image: require("../../assets/onboarding/screen-2-search.png"),
  },
  {
    key: "3",
    title: "Verified listings only",
    subtitle: "Direct contact with owners & brokers",
    image: require("../../assets/onboarding/screen-3-trust.png"),
  },
  {
    key: "4",
    title: "Contact in seconds",
    subtitle: "No friction. No hidden fees",
    image: require("../../assets/onboarding/screen-4-speed.png"),
  },
  {
    key: "5",
    title: "AI-powered insights",
    subtitle: "Make confident real estate decisions",
    image: require("../../assets/onboarding/screen-5-ai.png"),
  },
];

/** Swipeable intro — `/onboarding`. Same story as web marketing screenshots. */
export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / SCREEN_W);
    if (i !== index && i >= 0 && i < SLIDES.length) setIndex(i);
  }, [index]);

  const finish = useCallback(() => {
    router.replace("/search");
  }, [router]);

  const next = useCallback(() => {
    if (index < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (index + 1) * SCREEN_W, animated: true });
    } else {
      finish();
    }
  }, [index, finish]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable onPress={finish} hitSlop={12} accessibilityRole="button" accessibilityLabel="Skip onboarding">
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        onScrollEndDrag={onScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((s) => (
          <View key={s.key} style={[styles.slide, { width: SCREEN_W }]}>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.subtitle}>{s.subtitle}</Text>
            <View style={styles.imgWrap}>
              <Image source={s.image} style={styles.img} resizeMode="contain" accessibilityIgnoresInvertColors />
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View key={s.key} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Pressable onPress={next} style={styles.cta} accessibilityRole="button">
          <Text style={styles.ctaText}>{index < SLIDES.length - 1 ? "Next" : "Start searching"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { paddingHorizontal: 20, paddingBottom: 8, alignItems: "flex-end" },
  skip: { color: MUTED, fontSize: 16, fontWeight: "600" },
  slide: { paddingHorizontal: 24, paddingBottom: 12 },
  title: {
    color: GOLD,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    color: "rgba(212, 175, 55, 0.75)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  imgWrap: {
    marginTop: 16,
    minHeight: 360,
    alignItems: "center",
    justifyContent: "center",
  },
  img: { width: SCREEN_W - 48, height: 400 },
  footer: { paddingHorizontal: 24, paddingBottom: 16, gap: 16 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#333" },
  dotActive: { backgroundColor: GOLD },
  cta: {
    backgroundColor: GOLD,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  ctaText: { color: "#000", fontWeight: "800", fontSize: 16 },
});
