import { useThemeMode } from "@/contexts/ThemeContext";

export function useTheme() {
  const { theme, isDark, mode, setMode } = useThemeMode();

  return {
    theme,
    isDark,
    mode,
    setMode,
  };
}
