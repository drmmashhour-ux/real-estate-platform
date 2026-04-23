import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../../theme/colors";

export function GoldButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.txt}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.gold,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.4 },
  txt: { color: "#111", fontWeight: "700", fontSize: 16 },
});
