import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, I18nManager } from "react-native";
import FeedersStackNavigator from "@/navigation/FeedersStackNavigator";
import TurbinesStackNavigator from "@/navigation/TurbinesStackNavigator";
import CalculationsStackNavigator from "@/navigation/CalculationsStackNavigator";
import ReportsStackNavigator from "@/navigation/ReportsStackNavigator";
import SettingsStackNavigator from "@/navigation/SettingsStackNavigator";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Typography } from "@/constants/theme";

export type MainTabParamList = {
  FeedersTab: undefined;
  TurbinesTab: undefined;
  CalculationsTab: undefined;
  ReportsTab: undefined;
  SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabConfig = {
  name: keyof MainTabParamList;
  component: React.ComponentType<object>;
  titleKey: "tab_feeders" | "tab_turbines" | "tab_calculations" | "tab_reports" | "tab_settings";
  iconName: "activity" | "wind" | "cpu" | "file-text" | "settings";
};

const TAB_SCREENS: TabConfig[] = [
  { name: "FeedersTab", component: FeedersStackNavigator, titleKey: "tab_feeders", iconName: "activity" },
  { name: "TurbinesTab", component: TurbinesStackNavigator, titleKey: "tab_turbines", iconName: "wind" },
  { name: "CalculationsTab", component: CalculationsStackNavigator, titleKey: "tab_calculations", iconName: "cpu" },
  { name: "ReportsTab", component: ReportsStackNavigator, titleKey: "tab_reports", iconName: "file-text" },
  { name: "SettingsTab", component: SettingsStackNavigator, titleKey: "tab_settings", iconName: "settings" },
];

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();

  // Use I18nManager.isRTL directly - this is the true native state after reload
  // Do NOT rely on context isRTL as it can be stale after reload
  const isRTL = I18nManager.isRTL;

  // Reverse tab order for RTL languages
  const screens = isRTL ? [...TAB_SCREENS].reverse() : TAB_SCREENS;
  
  // Get initial route based on direction (first tab after reversing)
  const initialRouteName = screens[0].name;

  return (
    <Tab.Navigator
      key={isRTL ? "rtl-tabs" : "ltr-tabs"}
      initialRouteName={initialRouteName}
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarLabelStyle: {
          fontFamily: Typography.small.fontFamily,
          fontSize: 11,
          fontWeight: "700",
          writingDirection: isRTL ? "rtl" : "ltr",
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundDefault,
            web: theme.backgroundDefault,
          }),
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
      }}
    >
      {screens.map((screen) => (
        <Tab.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={{
            title: t(screen.titleKey),
            tabBarIcon: ({ color, size }) => (
              <Feather name={screen.iconName} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
