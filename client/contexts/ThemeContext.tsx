import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/theme";

export type ThemeMode = "system" | "light" | "dark";

const THEME_STORAGE_KEY = "pp-app:theme-mode";

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  theme: typeof Colors.light;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useSystemColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && (savedMode === "system" || savedMode === "light" || savedMode === "dark")) {
          setModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.error("Error loading theme:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const isDark = useMemo(() => {
    if (mode === "system") {
      return systemColorScheme === "dark";
    }
    return mode === "dark";
  }, [mode, systemColorScheme]);

  const theme = useMemo(() => {
    return isDark ? Colors.dark : Colors.light;
  }, [isDark]);

  const value = useMemo(
    () => ({
      mode,
      isDark,
      theme,
      setMode,
    }),
    [mode, isDark, theme]
  );

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
