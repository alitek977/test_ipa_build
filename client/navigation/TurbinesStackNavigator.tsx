import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TurbinesScreen from "@/screens/TurbinesScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type TurbinesStackParamList = {
  Turbines: undefined;
};

const Stack = createNativeStackNavigator<TurbinesStackParamList>();

export default function TurbinesStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Turbines"
        component={TurbinesScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Turbines" />,
        }}
      />
    </Stack.Navigator>
  );
}
