import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ReportsScreen from "@/screens/ReportsScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ReportsStackParamList = {
  Reports: undefined;
};

const Stack = createNativeStackNavigator<ReportsStackParamList>();

export default function ReportsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Reports" />,
        }}
      />
    </Stack.Navigator>
  );
}
