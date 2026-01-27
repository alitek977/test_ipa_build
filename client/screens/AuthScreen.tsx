import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

type AuthMode = "login" | "signup" | "forgot";

export function AuthScreen() {
  const { theme } = useTheme();
  const { signIn, signUp, resetPassword } = useAuth();
  const { language } = useLanguage();

  const isArabic = language === "ar";

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const texts = {
    appName: isArabic ? "حسابات محطة الطاقة" : "Power Plant Calc",
    loginSubtitle: isArabic ? "تسجيل الدخول إلى حسابك" : "Sign in to your account",
    signupSubtitle: isArabic ? "إنشاء حساب جديد" : "Create a new account",
    forgotSubtitle: isArabic ? "إعادة تعيين كلمة المرور" : "Reset your password",
    displayName: isArabic ? "الاسم" : "Display Name",
    displayNamePlaceholder: isArabic ? "مهندس" : "Engineer",
    email: isArabic ? "البريد الإلكتروني" : "Email",
    emailPlaceholder: "you@example.com",
    password: isArabic ? "كلمة المرور" : "Password",
    forgotPassword: isArabic ? "نسيت كلمة المرور؟" : "Forgot password?",
    signIn: isArabic ? "تسجيل الدخول" : "Sign In",
    signUp: isArabic ? "إنشاء حساب" : "Sign Up",
    sendResetLink: isArabic ? "إرسال رابط إعادة التعيين" : "Send Reset Link",
    noAccount: isArabic ? "ليس لديك حساب؟" : "Don't have an account?",
    haveAccount: isArabic ? "لديك حساب بالفعل؟" : "Already have an account?",
    checkEmail: isArabic ? "تحقق من بريدك" : "Check your email",
    confirmationSent: isArabic ? "أرسلنا لك رابط التأكيد" : "We sent you a confirmation link",
    resetLinkSent: isArabic ? "أرسلنا لك رابط إعادة التعيين" : "We sent you a password reset link",
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        }
      } else if (mode === "signup") {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          setError(error.message);
        } else {
          Alert.alert(texts.checkEmail, texts.confirmationSent);
          setMode("login");
        }
      } else if (mode === "forgot") {
        const { error } = await resetPassword(email);
        if (error) {
          setError(error.message);
        } else {
          Alert.alert(texts.checkEmail, texts.resetLinkSent);
          setMode("login");
        }
      }
    } catch (e) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 24,
    },
    header: {
      alignItems: "center",
      marginBottom: 40,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: theme.primary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    form: {
      gap: 16,
    },
    inputContainer: {
      gap: 8,
    },
    label: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: "500",
    },
    input: {
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: theme.text,
    },
    button: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      marginTop: 8,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
    switchContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 24,
      gap: 8,
    },
    switchText: {
      color: theme.textSecondary,
    },
    switchLink: {
      color: theme.primary,
      fontWeight: "600",
    },
    forgotButton: {
      alignItems: "flex-end",
      marginTop: -8,
    },
    forgotText: {
      color: theme.primary,
      fontSize: 14,
    },
    errorText: {
      color: theme.error,
      textAlign: "center",
      marginBottom: 16,
    },
  });

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <ThemedText style={styles.title}>{texts.appName}</ThemedText>
            <ThemedText style={styles.subtitle}>
              {mode === "login"
                ? texts.loginSubtitle
                : mode === "signup"
                ? texts.signupSubtitle
                : texts.forgotSubtitle}
            </ThemedText>
          </View>

          {error ? (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          ) : null}

          <View style={styles.form}>
            {mode === "signup" && (
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>{texts.displayName}</ThemedText>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder={texts.displayNamePlaceholder}
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>{texts.email}</ThemedText>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={texts.emailPlaceholder}
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {mode !== "forgot" && (
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>{texts.password}</ThemedText>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            )}

            {mode === "login" && (
              <TouchableOpacity
                style={styles.forgotButton}
                onPress={() => setMode("forgot")}
              >
                <ThemedText style={styles.forgotText}>
                  {texts.forgotPassword}
                </ThemedText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.buttonText}>
                  {mode === "login"
                    ? texts.signIn
                    : mode === "signup"
                    ? texts.signUp
                    : texts.sendResetLink}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.switchContainer}>
            {mode === "login" ? (
              <>
                <ThemedText style={styles.switchText}>{texts.noAccount}</ThemedText>
                <TouchableOpacity onPress={() => setMode("signup")}>
                  <ThemedText style={styles.switchLink}>{texts.signUp}</ThemedText>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <ThemedText style={styles.switchText}>{texts.haveAccount}</ThemedText>
                <TouchableOpacity onPress={() => setMode("login")}>
                  <ThemedText style={styles.switchLink}>{texts.signIn}</ThemedText>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
