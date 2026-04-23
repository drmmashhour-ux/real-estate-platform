import { useLocalSearchParams } from "expo-router";
import { View, Text } from "react-native";

export default function Property() {
  const { id } = useLocalSearchParams();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Property {id}</Text>
    </View>
  );
}
