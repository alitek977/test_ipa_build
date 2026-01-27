import React, { useEffect } from "react";
import { StyleSheet, View, Text, I18nManager } from "react-native";
import { NavigationContainer, DefaultTheme, DarkTheme, Theme } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DayProvider } from "@/contexts/DayContext";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider, useThemeMode } from "@/contexts/ThemeContext";
import { AuthScreen } from "@/screens/AuthScreen";

SplashScreen.preventAutoHideAsync();

function ManualRestartScreen({ isRTL }: { isRTL: boolean }) {
  const { theme } = useThemeMode();
  return (
    <View style={[styles.restartContainer, { backgroundColor: theme.backgroundDefault }]}>
      <Text style={[styles.restartTitle, { textAlign: isRTL ? "right" : "left", color: theme.text }]}>
        {isRTL ? "يرجى إعادة تشغيل التطبيق" : "Please Restart the App"}
      </Text>
      <Text style={[styles.restartMessage, { textAlign: isRTL ? "right" : "left", color: theme.textSecondary }]}>
        {isRTL 
          ? "أغلق التطبيق تماماً وأعد فتحه لتطبيق إعدادات اللغة بشكل صحيح."
          : "Please close the app completely and reopen it to apply language settings correctly."}
      </Text>
    </View>
  );
}

function useNavigationTheme(): Theme {
  const { theme, isDark } = useThemeMode();
  
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  
  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: theme.primary,
      background: theme.backgroundRoot,
      card: theme.backgroundDefault,
      text: theme.text,
      border: theme.border,
      notification: theme.primary,
    },
  };
}

function AuthenticatedApp() {
  const { isDark } = useThemeMode();
  const navigationTheme = useNavigationTheme();
  
  // Use I18nManager.isRTL directly - this is the true source after reload
  // Context isRTL can be stale; I18nManager reflects the actual native state
  const nativeIsRTL = I18nManager.isRTL;
  
  return (
    <DayProvider>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
          <KeyboardProvider>
            <NavigationContainer 
              key={nativeIsRTL ? "rtl" : "ltr"}
              theme={navigationTheme}
            >
              <RootStackNavigator />
            </NavigationContainer>
            <StatusBar style={isDark ? "light" : "dark"} />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </DayProvider>
  );
}

function AppContent() {
  const { needsManualRestart, isRTL } = useLanguage();
  const { user, loading } = useAuth();
  const { theme, isDark } = useThemeMode();

  if (needsManualRestart) {
    return <ManualRestartScreen isRTL={isRTL} />;
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundDefault }]}>
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
          <AuthScreen />
          <StatusBar style={isDark ? "light" : "dark"} />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  return <AuthenticatedApp />;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ErrorBoundary>
          <LanguageProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </LanguageProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  restartContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  restartTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
  restartMessage: {
    fontSize: 16,
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
});
