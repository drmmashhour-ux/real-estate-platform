import { NavigationContainer, NavigationIndependentTree } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { AppNavigator, managerTheme } from "../navigation/AppNavigator";

/**
 * LECIPM Manager shell: React Navigation stack on top of Expo Router.
 * Default entry: `src/app/index.tsx` redirects here.
 */
export default function ManagerRoute() {
  return (
    <>
      <StatusBar style="light" />
      <NavigationIndependentTree>
        <NavigationContainer theme={managerTheme}>
          <AppNavigator />
        </NavigationContainer>
      </NavigationIndependentTree>
    </>
  );
}
