import { StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";

/**
 * Placeholder layout matching `PropertyCard` while listings load.
 */
export default function PropertyCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.image} />
      <View style={styles.body}>
        <View style={styles.lineLg} />
        <View style={styles.lineMd} />
        <View style={styles.lineSm} />
        <View style={styles.price} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: 16,
  },
  image: {
    width: "100%",
    height: 200,
    backgroundColor: colors.surface2,
  },
  body: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  lineLg: {
    height: 18,
    borderRadius: 6,
    backgroundColor: colors.surface2,
    width: "88%",
  },
  lineMd: {
    height: 14,
    borderRadius: 6,
    backgroundColor: colors.surface2,
    width: "55%",
  },
  lineSm: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.surface2,
    width: "70%",
  },
  price: {
    height: 22,
    borderRadius: 6,
    backgroundColor: colors.surface2,
    width: "40%",
    marginTop: 4,
  },
});
