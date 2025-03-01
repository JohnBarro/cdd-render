import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import MainView from "../views/MainView";
import MapViewScreen from "../views/MapViewScreen";

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main">
        <Stack.Screen name="Main" component={MainView} />
        <Stack.Screen name="Map" component={MapViewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
