import { useEffect, useLayoutEffect } from "react";
import { ImageBackground, StyleSheet, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const splashAsset = require("../../assets/splash.png");

const ELITE_ENABLED = process.env.EXPO_PUBLIC_SPLASH_ANIMATION !== "0";

/**
 * Dismisses the native splash when JS is ready, then optionally runs a short
 * gold glow pulse + subtle logo scale (matches static splash.png for a seamless handoff).
 */
export function BrandedSplashTransition({ onComplete }: { onComplete: () => void }) {
  const overlayOpacity = useSharedValue(1);
  const glow = useSharedValue(0);
  const scale = useSharedValue(1);

  useLayoutEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (!ELITE_ENABLED) {
      const id = requestAnimationFrame(() => onComplete());
      return () => cancelAnimationFrame(id);
    }

    glow.value = withSequence(
      withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) }),
      withTiming(0.38, { duration: 780, easing: Easing.inOut(Easing.cubic) })
    );
    scale.value = withSequence(
      withTiming(1.028, { duration: 560, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 480, easing: Easing.inOut(Easing.cubic) })
    );

    const finish = () => {
      overlayOpacity.value = withTiming(
        0,
        { duration: 400, easing: Easing.inOut(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(onComplete)();
        }
      );
    };

    const t = setTimeout(finish, 1520);
    return () => clearTimeout(t);
  }, [glow, onComplete, overlayOpacity, scale]);

  const rootStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.05 + glow.value * 0.18,
  }));

  if (!ELITE_ENABLED) {
    return null;
  }

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.layer, rootStyle]}
      pointerEvents="auto"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[styles.fill, contentScaleStyle]}>
        <ImageBackground source={splashAsset} style={styles.fill} resizeMode="contain">
          <View style={styles.fill} />
        </ImageBackground>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.glowBlob, glowStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    zIndex: 9999,
    backgroundColor: "#000000",
  },
  fill: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  glowBlob: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: "#D4AF37",
    alignSelf: "center",
    top: "30%",
  },
});
