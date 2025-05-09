import 'react-native-gesture-handler';
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./src/navigation/AppNavigator";
import { GestureHandlerRootView } from "react-native-gesture-handler"; // Required for react-navigation

// Import global styles or theme providers if any
// import { ThemeProvider } from "./src/styles/theme"; // Example

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        {/* <ThemeProvider> */}
        <AppNavigator />
        {/* </ThemeProvider> */}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;

