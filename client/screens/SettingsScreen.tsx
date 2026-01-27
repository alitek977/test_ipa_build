import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import Constants from "expo-constants";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { ThemeMode } from "@/contexts/ThemeContext";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRTL } from "@/hooks/useRTL";
import { Language } from "@/lib/i18n";

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
];

interface ThemeOption {
  mode: ThemeMode;
  titleKey: "system_theme" | "light_mode" | "dark_mode";
  descKey: "theme_system_desc" | "theme_light_desc" | "theme_dark_desc";
  icon: "smartphone" | "sun" | "moon";
}

const THEME_OPTIONS: ThemeOption[] = [
  { mode: "system", titleKey: "system_theme", descKey: "theme_system_desc", icon: "smartphone" },
  { mode: "light", titleKey: "light_mode", descKey: "theme_light_desc", icon: "sun" },
  { mode: "dark", titleKey: "dark_mode", descKey: "theme_dark_desc", icon: "moon" },
];

type AuthMode = "none" | "signup" | "signin";

export default function SettingsScreen() {
  const { theme, mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const layout = useResponsiveLayout();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const { user, signOut, signIn, isGuest, upgradeGuestAccount, authError } = useAuth();
  const { rtlRow, rtlText } = useRTL();

  const [authMode, setAuthMode] = useState<AuthMode>("none");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    signOut();
  };

  const appVersion = Constants.expoConfig?.version || "1.0.0";

  const handleSelectLanguage = (lang: Language) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLanguage(lang);
  };

  const handleSelectTheme = (themeMode: ThemeMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMode(themeMode);
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setDisplayName("");
    setError(null);
    setAuthMode("none");
  };

  const handleUpgradeAccount = async () => {
    if (!email || !password) {
      setError(t("email") + " " + t("password") + " required");
      return;
    }

    if (authMode === "signup" && password !== confirmPassword) {
      setError(t("passwords_dont_match"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (authMode === "signup") {
        const result = await upgradeGuestAccount(email, password, displayName || undefined);
        if (result.error) {
          setError(result.error);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert(t("account_upgraded"), "", [{ text: "OK" }]);
          resetForm();
        }
      } else if (authMode === "signin") {
        const result = await signIn(email, password);
        if (result.error) {
          setError(result.error.message);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert(t("sign_in_success"), "", [{ text: "OK" }]);
          resetForm();
        }
      }
    } catch (e: any) {
      setError(e.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const renderSetupRequiredSection = () => (
    <Animated.View entering={FadeInDown.delay(100).duration(300)}>
      <ThemedText type="h3" style={[styles.sectionTitle, rtlText]}>
        {t("account")}
      </ThemedText>

      <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
        <View style={[styles.aboutRow, rtlRow]}>
          <View style={[styles.iconCircle, { backgroundColor: theme.warning + "20" }]}>
            <Feather name="alert-circle" size={20} color={theme.warning} />
          </View>
          <View style={{ marginHorizontal: Spacing.md, flex: 1 }}>
            <ThemedText type="body" style={[{ fontFamily: Typography.h4.fontFamily }, rtlText]}>
              {isRTL ? "مطلوب إعداد" : "Setup Required"}
            </ThemedText>
            <ThemedText type="small" style={[{ color: theme.textSecondary }, rtlText]}>
              {isRTL 
                ? "يرجى تمكين تسجيل الدخول المجهول في لوحة تحكم Supabase"
                : "Please enable Anonymous Sign-In in Supabase Dashboard > Authentication > Providers"
              }
            </ThemedText>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderGuestSection = () => (
    <Animated.View entering={FadeInDown.delay(100).duration(300)}>
      <ThemedText type="h3" style={[styles.sectionTitle, rtlText]}>
        {t("account")}
      </ThemedText>

      <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
        {authMode === "none" ? (
          <>
            <View style={[styles.aboutRow, rtlRow, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
              <View style={[styles.iconCircle, { backgroundColor: theme.warning + "20" }]}>
                <Feather name="user" size={20} color={theme.warning} />
              </View>
              <View style={{ marginHorizontal: Spacing.md, flex: 1 }}>
                <ThemedText type="body" style={[{ fontFamily: Typography.h4.fontFamily }, rtlText]}>
                  {t("guest_mode")}
                </ThemedText>
                <ThemedText type="small" style={[{ color: theme.textSecondary }, rtlText]}>
                  {t("guest_mode_desc")}
                </ThemedText>
              </View>
            </View>

            <Pressable
              style={[styles.aboutRow, rtlRow, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setAuthMode("signup");
              }}
            >
              <View style={[styles.iconCircle, { backgroundColor: theme.success + "20" }]}>
                <Feather name="user-plus" size={20} color={theme.success} />
              </View>
              <View style={{ marginHorizontal: Spacing.md, flex: 1 }}>
                <ThemedText type="body" style={[{ fontFamily: Typography.h4.fontFamily, color: theme.success }, rtlText]}>
                  {t("create_account")}
                </ThemedText>
                <ThemedText type="small" style={[{ color: theme.textSecondary }, rtlText]}>
                  {t("upgrade_account_desc")}
                </ThemedText>
              </View>
              <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={20} color={theme.textSecondary} />
            </Pressable>

            <Pressable
              style={[styles.aboutRow, rtlRow]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setAuthMode("signin");
              }}
            >
              <View style={[styles.iconCircle, { backgroundColor: theme.primary + "20" }]}>
                <Feather name="log-in" size={20} color={theme.primary} />
              </View>
              <View style={{ marginHorizontal: Spacing.md, flex: 1 }}>
                <ThemedText type="body" style={[{ fontFamily: Typography.h4.fontFamily, color: theme.primary }, rtlText]}>
                  {t("sign_in")}
                </ThemedText>
                <ThemedText type="small" style={[{ color: theme.textSecondary }, rtlText]}>
                  {t("already_have_account")}
                </ThemedText>
              </View>
              <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={20} color={theme.textSecondary} />
            </Pressable>
          </>
        ) : (
          <View style={styles.formContainer}>
            <View style={[rtlRow, { alignItems: "center", marginBottom: Spacing.lg }]}>
              <Pressable onPress={resetForm} style={{ padding: Spacing.sm }}>
                <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={24} color={theme.text} />
              </Pressable>
              <ThemedText type="h4" style={[{ flex: 1, textAlign: "center" }, rtlText]}>
                {authMode === "signup" ? t("create_account") : t("sign_in")}
              </ThemedText>
              <View style={{ width: 40 }} />
            </View>

            {error && (
              <View style={[styles.errorBox, { backgroundColor: theme.error + "20" }]}>
                <ThemedText type="small" style={{ color: theme.error, textAlign: "center" }}>
                  {error}
                </ThemedText>
              </View>
            )}

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }, rtlText]}>
                {t("email")}
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundRoot,
                    color: theme.text,
                    borderColor: theme.border,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }, rtlText]}>
                {t("password")}
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundRoot,
                    color: theme.text,
                    borderColor: theme.border,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
              />
            </View>

            {authMode === "signup" && (
              <>
                <View style={styles.inputGroup}>
                  <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }, rtlText]}>
                    {t("confirm_password")}
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.backgroundRoot,
                        color: theme.text,
                        borderColor: theme.border,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="••••••••"
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText type="small" style={[styles.inputLabel, { color: theme.textSecondary }, rtlText]}>
                    {t("display_name")} ({t("optional")})
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.backgroundRoot,
                        color: theme.text,
                        borderColor: theme.border,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Engineer"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="words"
                  />
                </View>
              </>
            )}

            <Pressable
              style={[
                styles.submitButton,
                { backgroundColor: theme.primary },
                loading && { opacity: 0.7 },
              ]}
              onPress={handleUpgradeAccount}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText type="body" style={{ color: "#fff", fontWeight: "600" }}>
                  {authMode === "signup" ? t("create_account") : t("sign_in")}
                </ThemedText>
              )}
            </Pressable>

            <Pressable
              style={styles.switchModeButton}
              onPress={() => {
                setError(null);
                setAuthMode(authMode === "signup" ? "signin" : "signup");
              }}
            >
              <ThemedText type="small" style={{ color: theme.primary, textAlign: "center" }}>
                {authMode === "signup" ? t("already_have_account") : t("dont_have_account")}
              </ThemedText>
            </Pressable>
          </View>
        )}
      </View>
    </Animated.View>
  );

  const renderLoggedInSection = () => (
    <Animated.View entering={FadeInDown.delay(100).duration(300)}>
      <ThemedText type="h3" style={[styles.sectionTitle, rtlText]}>
        {t("account")}
      </ThemedText>

      <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
        <View style={[styles.aboutRow, rtlRow, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
          <View style={[styles.iconCircle, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="user" size={20} color={theme.primary} />
          </View>
          <View style={{ marginHorizontal: Spacing.md, flex: 1 }}>
            <ThemedText type="body" style={[{ fontFamily: Typography.h4.fontFamily }, rtlText]}>
              {t("email")}
            </ThemedText>
            <ThemedText type="small" style={[{ color: theme.textSecondary }, rtlText]}>
              {user?.email || ""}
            </ThemedText>
          </View>
        </View>

        <Pressable
          style={[styles.aboutRow, rtlRow]}
          onPress={handleSignOut}
        >
          <View style={[styles.iconCircle, { backgroundColor: theme.error + "20" }]}>
            <Feather name="log-out" size={20} color={theme.error} />
          </View>
          <View style={{ marginHorizontal: Spacing.md, flex: 1 }}>
            <ThemedText type="body" style={[{ fontFamily: Typography.h4.fontFamily, color: theme.error }, rtlText]}>
              {t("sign_out")}
            </ThemedText>
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: layout.horizontalPadding,
          maxWidth: layout.isTablet ? layout.contentMaxWidth : undefined,
          alignSelf: layout.isTablet ? "center" : undefined,
          width: layout.isTablet ? "100%" : undefined,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.duration(300)}>
          <ThemedText type="h3" style={[styles.sectionTitle, rtlText]}>
            {t("language")}
          </ThemedText>

          <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.cardHeader, rtlRow, { borderBottomColor: theme.border }]}>
              <View style={[rtlRow, { alignItems: "center" }]}>
                <View style={[styles.iconCircle, { backgroundColor: theme.primary + "20" }]}>
                  <Feather name="globe" size={20} color={theme.primary} />
                </View>
                <View style={{ marginHorizontal: Spacing.md }}>
                  <ThemedText type="body" style={[{ fontFamily: Typography.h4.fontFamily }, rtlText]}>
                    {t("language")}
                  </ThemedText>
                  <ThemedText type="small" style={[{ color: theme.textSecondary }, rtlText]}>
                    {t("select_language")}
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.languageOptions}>
              {LANGUAGES.map((lang) => (
                <Pressable
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    { borderColor: language === lang.code ? theme.primary : theme.border },
                    language === lang.code && { backgroundColor: theme.primary + "15" },
                  ]}
                  onPress={() => handleSelectLanguage(lang.code)}
                  testID={`button-language-${lang.code}`}
                >
                  <View style={[rtlRow, { alignItems: "center", justifyContent: "space-between" }]}>
                    <View>
                      <ThemedText type="body" style={[{ fontWeight: "600" }, rtlText]}>
                        {lang.nativeName}
                      </ThemedText>
                      <ThemedText type="small" style={[{ color: theme.textSecondary }, rtlText]}>
                        {lang.name}
                      </ThemedText>
                    </View>
                    {language === lang.code ? (
                      <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
                        <Feather name="check" size={16} color="#fff" />
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(50).duration(300)}>
          <ThemedText type="h3" style={[styles.sectionTitle, rtlText]}>
            {t("theme")}
          </ThemedText>

          <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.cardHeader, rtlRow, { borderBottomColor: theme.border }]}>
              <View style={[rtlRow, { alignItems: "center" }]}>
                <View style={[styles.iconCircle, { backgroundColor: theme.primary + "20" }]}>
                  <Feather name="moon" size={20} color={theme.primary} />
                </View>
                <View style={{ marginHorizontal: Spacing.md }}>
                  <ThemedText type="body" style={[{ fontFamily: Typography.h4.fontFamily }, rtlText]}>
                    {t("theme")}
                  </ThemedText>
                  <ThemedText type="small" style={[{ color: theme.textSecondary }, rtlText]}>
                    {t("select_theme")}
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.languageOptions}>
              {THEME_OPTIONS.map((option) => (
                <Pressable
                  key={option.mode}
                  style={[
                    styles.languageOption,
                    { borderColor: mode === option.mode ? theme.primary : theme.border },
                    mode === option.mode && { backgroundColor: theme.primary + "15" },
                  ]}
                  onPress={() => handleSelectTheme(option.mode)}
                  testID={`button-theme-${option.mode}`}
                >
                  <View style={[rtlRow, { alignItems: "center", justifyContent: "space-between" }]}>
                    <View style={[rtlRow, { alignItems: "center", flex: 1 }]}>
                      <Feather 
                        name={option.icon} 
                        size={20} 
                        color={mode === option.mode ? theme.primary : theme.textSecondary} 
                        style={{ marginRight: isRTL ? 0 : Spacing.md, marginLeft: isRTL ? Spacing.md : 0 }}
                      />
                      <View>
                        <ThemedText type="body" style={[{ fontWeight: "600" }, rtlText]}>
                          {t(option.titleKey)}
                        </ThemedText>
                        <ThemedText type="small" style={[{ color: theme.textSecondary }, rtlText]}>
                          {t(option.descKey)}
                        </ThemedText>
                      </View>
                    </View>
                    {mode === option.mode ? (
                      <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
                        <Feather name="check" size={16} color="#fff" />
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>

        {!user && authError ? renderSetupRequiredSection() : isGuest ? renderGuestSection() : renderLoggedInSection()}

        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <ThemedText type="h3" style={[styles.sectionTitle, rtlText]}>
            {t("about")}
          </ThemedText>

          <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.aboutRow, rtlRow, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
              <View style={[styles.iconCircle, { backgroundColor: theme.primary + "20" }]}>
                <Feather name="zap" size={20} color={theme.primary} />
              </View>
              <View style={{ marginHorizontal: Spacing.md, flex: 1 }}>
                <ThemedText type="body" style={[{ fontFamily: Typography.h4.fontFamily }, rtlText]}>
                  {t("app_name")}
                </ThemedText>
                <ThemedText type="small" style={[{ color: theme.textSecondary }, rtlText]}>
                  {t("version_label")}{" "}
                  <ThemedText type="small" style={{ color: theme.textSecondary, writingDirection: "ltr" }}>
                    {appVersion}
                  </ThemedText>
                </ThemedText>
              </View>
            </View>

            <View style={[styles.aboutRow, rtlRow, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
              <View style={[styles.iconCircle, { backgroundColor: theme.success + "20" }]}>
                <Feather name="user" size={20} color={theme.success} />
              </View>
              <View style={{ marginHorizontal: Spacing.md, flex: 1 }}>
                <ThemedText type="body" style={[{ fontFamily: Typography.h4.fontFamily }, rtlText]}>
                  {t("developer")}
                </ThemedText>
                <ThemedText type="small" style={[{ color: theme.textSecondary }, rtlText]}>
                  {t("developer_name")}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.aboutRow, rtlRow]}>
              <View style={[styles.iconCircle, { backgroundColor: theme.warning + "20" }]}>
                <Feather name="shield" size={20} color={theme.warning} />
              </View>
              <View style={{ marginHorizontal: Spacing.md, flex: 1 }}>
                <ThemedText type="body" style={[{ fontFamily: Typography.h4.fontFamily }, rtlText]}>
                  {t("copyright")}
                </ThemedText>
                <ThemedText type="small" style={[{ color: theme.textSecondary }, rtlText]}>
                  {t("copyright_text")}
                </ThemedText>
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center", writingDirection: "ltr" }}>
            {t("version")}
          </ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  languageOptions: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  languageOption: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  footer: {
    marginTop: Spacing.xl,
    alignItems: "center",
    paddingBottom: Spacing.xl,
  },
  formContainer: {
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    marginBottom: Spacing.xs,
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  errorBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  submitButton: {
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
  },
  switchModeButton: {
    marginTop: Spacing.lg,
    padding: Spacing.sm,
  },
});
