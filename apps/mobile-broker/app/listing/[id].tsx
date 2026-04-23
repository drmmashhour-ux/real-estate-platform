import { useLocalSearchParams } from "expo-router";
import { View, Text } from "react-native";

export default function ListingDetail() {
  const { id } = useLocalSearchParams();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Listing Detail: {id}</Text>
    </View>
  );
}
