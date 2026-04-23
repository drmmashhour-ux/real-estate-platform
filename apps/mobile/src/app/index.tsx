import { Redirect } from "expo-router";

/** BNHub mobile shell with bottom tabs (`/(tabs)`). Manager stack remains at `/manager`. */
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
