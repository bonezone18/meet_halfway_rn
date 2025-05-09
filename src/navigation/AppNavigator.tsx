import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "../screens/HomeScreen";
import ResultsScreen from "../screens/ResultsScreen";
import PlaceDetailsScreen from "../screens/PlaceDetailsScreen";
import DirectionsScreen from "../screens/DirectionsScreen";

// Define a type for the stack navigator's params
export type RootStackParamList = {
  Home: undefined;
  Results: undefined; // Or pass params if ResultsScreen expects them, e.g., { midpointId: string }
  PlaceDetails: { placeId: string }; // Example: pass placeId or the whole Place object
  Directions: { placeId: string }; // Example: pass placeId or the whole Place object
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: "Meeting Point Finder" }} 
      />
      <Stack.Screen 
        name="Results" 
        component={ResultsScreen} 
        options={{ title: "Meeting Point Results" }} 
      />
      <Stack.Screen 
        name="PlaceDetails" 
        component={PlaceDetailsScreen} 
        // Options can be dynamic, e.g., options={({ route }) => ({ title: route.params.placeName })}
        options={{ title: "Place Details" }}
      />
      <Stack.Screen 
        name="Directions" 
        component={DirectionsScreen} 
        options={{ title: "Directions" }} 
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;

