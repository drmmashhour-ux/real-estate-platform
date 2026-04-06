import { Redirect } from "expo-router";

/** LECIPM Manager (stack) is the primary entry; classic hub stays at `/(tabs)`. */
export default function Index() {
  return <Redirect href="/manager" />;
}
