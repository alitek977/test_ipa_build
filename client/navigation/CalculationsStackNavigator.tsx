import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CalculationsScreen from "@/screens/CalculationsScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type CalculationsStackParamList = {
  Calculations: undefined;
};

const Stack = createNativeStackNavigator<CalculationsStackParamList>();

export default function CalculationsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Calculations"
        component={CalculationsScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Calculations" />,
        }}
      />
    </Stack.Navigator>
  );
}
