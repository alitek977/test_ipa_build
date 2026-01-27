import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#0F172A",
    textSecondary: "#64748B",
    buttonText: "#FFFFFF",
    tabIconDefault: "#64748B",
    tabIconSelected: "#0099CC",
    link: "#0099CC",
    primary: "#0099CC",
    backgroundRoot: "#F8FAFC",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#F1F5F9",
    backgroundTertiary: "#E2E8F0",
    border: "#E2E8F0",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#94A3B8",
    buttonText: "#0A0E1A",
    tabIconDefault: "#94A3B8",
    tabIconSelected: "#00D9FF",
    link: "#00D9FF",
    primary: "#00D9FF",
    backgroundRoot: "#0A0E1A",
    backgroundDefault: "#1A1F2E",
    backgroundSecondary: "#252B3D",
    backgroundTertiary: "#2D3748",
    border: "#2D3748",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
  "5xl": 56,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
    fontFamily: "Outfit_700Bold",
  },
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
    fontFamily: "Outfit_700Bold",
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
    fontFamily: "Outfit_600SemiBold",
  },
  h3: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "600" as const,
    fontFamily: "Outfit_600SemiBold",
  },
  h4: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600" as const,
    fontFamily: "Outfit_600SemiBold",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
    fontFamily: "Outfit_400Regular",
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
    fontFamily: "Outfit_400Regular",
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
    fontFamily: "Outfit_400Regular",
  },
  mono: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500" as const,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
    fontFamily: "Outfit_400Regular",
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "Outfit_400Regular",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "Menlo",
  },
  default: {
    sans: "Outfit_400Regular",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "Outfit_400Regular, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Shadows = {
  fab: {
    shadowColor: "#00D9FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  cardElevated: {
    shadowColor: "#00D9FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  glow: {
    shadowColor: "#00D9FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
};

export const TabletBreakpoint = 768;
export const TabletMaxContentWidth = 900;
