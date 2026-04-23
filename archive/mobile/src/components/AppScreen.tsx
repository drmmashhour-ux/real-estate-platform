import type { PropsWithChildren } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { theme } from "@/lib/theme";

type AppScreenProps = PropsWithChildren<{
  scroll?: boolean;
}>;

export function AppScreen({ children, scroll = true }: AppScreenProps) {
  const content = <View style={styles.inner}>{children}</View>;

  return (
    <SafeAreaView style={styles.safe}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  inner: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
