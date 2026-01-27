import React, { useMemo, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { CalendarPicker } from "@/components/CalendarPicker";
import { NumericInputField } from "@/components/NumericInputField";
import { HoursInputField } from "@/components/HoursInputField";
import { useTheme } from "@/hooks/useTheme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { Spacing, BorderRadius, Typography, Shadows } from "@/constants/theme";
import { useDay } from "@/contexts/DayContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRTL } from "@/hooks/useRTL";
import { TURBINES, format2, turbineRowComputed, numberTextStyle, formatDateKey, todayKey } from "@/lib/storage";
import { showSuccess, showError } from "@/utils/notify";

function getDayLetter(dateStr: string): string {
  const letters = ["B", "D", "A", "C"];
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "A";
  const epoch = new Date("2026-01-18");
  const diffDays = Math.floor((date.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24));
  const index = ((diffDays % 4) + 4) % 4;
  return letters[index];
}

export default function TurbinesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const layout = useResponsiveLayout();
  const { dateKey, setDateKey, day, setDay, saveDay, resetDay } = useDay();
  const { t: translate, isRTL } = useLanguage();
  const { rtlRow, rtlText } = useRTL();

  const rows = useMemo(() => {
    return TURBINES.map((t) => ({
      t,
      ...turbineRowComputed(day, t),
    }));
  }, [day]);

  const totalProduction = rows.reduce((a, r) => a + r.diff, 0);

  const [isSaving, setIsSaving] = useState(false);
  const saveLockRef = useRef(false);

  const handleSave = async () => {
    if (saveLockRef.current || isSaving) return;
    saveLockRef.current = true;
    setIsSaving(true);

    try {
      await saveDay();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccess(translate("msg_saved_success"));
    } catch (error) {
      showError(translate("msg_error_generic"));
    } finally {
      setIsSaving(false);
      saveLockRef.current = false;
    }
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetDay();
    showSuccess(translate("msg_reset_done"));
  };

  const [showDatePicker, setShowDatePicker] = useState(false);
  const dayLetter = getDayLetter(dateKey);

  const handleSetToday = () => {
    setDateKey(todayKey());
    setShowDatePicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDateChange = (days: number) => {
    const current = new Date(dateKey);
    if (isNaN(current.getTime())) {
      handleSetToday();
      return;
    }
    current.setDate(current.getDate() + days);
    setDateKey(formatDateKey(current));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const isToday = dateKey === todayKey();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
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
      >
        <View style={[styles.headerRow, rtlRow]}>
          <Pressable
            style={[styles.todayButton, rtlRow, { borderColor: theme.primary, backgroundColor: theme.primary + "10" }]}
            onPress={() => setShowDatePicker(true)}
            testID="button-date"
          >
            <Feather name="calendar" size={18} color={theme.primary} />
            <ThemedText type="body" style={{ color: theme.primary, marginHorizontal: Spacing.sm, fontWeight: "600" }}>
              {isToday ? translate("today") : dateKey}
            </ThemedText>
          </Pressable>

          <View style={[styles.actionButtons, rtlRow]}>
            <View style={[styles.letterCircle, { borderColor: theme.primary, backgroundColor: theme.primary + "10" }]}>
              <ThemedText type="h3" style={{ color: theme.primary, fontWeight: "700" }}>
                {dayLetter}
              </ThemedText>
            </View>
            <Pressable
              style={[styles.circleButton, { backgroundColor: "#f04438" }]}
              onPress={handleReset}
              testID="button-reset"
            >
              <Feather name="rotate-ccw" size={20} color="#fff" />
            </Pressable>
            <Pressable
              style={[
                styles.circleButton,
                { backgroundColor: theme.primary, ...Shadows.fab },
                isSaving && { opacity: 0.6 },
              ]}
              onPress={handleSave}
              disabled={isSaving}
              testID="button-save"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="save" size={20} color="#fff" />
              )}
            </Pressable>
          </View>
        </View>

        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowDatePicker(false)}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <CalendarPicker
                selectedDate={dateKey}
                onSelectDate={setDateKey}
                onClose={() => setShowDatePicker(false)}
              />
            </Pressable>
          </Pressable>
        </Modal>

        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
            <View style={[styles.iconCircle, { backgroundColor: theme.primary + "20" }]}>
              <Feather name="wind" size={18} color={theme.primary} />
            </View>
            <ThemedText type="h3" style={{ marginLeft: Spacing.md }}>
              {translate("turbines_title")}
            </ThemedText>
          </View>

          <View style={layout.isTablet ? styles.tabletGrid : undefined}>
            {TURBINES.map((t, index) => {
              const row = rows[index];
              const hasError = row.pres < row.prev && row.prev > 0;
              return (
                <Animated.View
                  key={t}
                  entering={FadeInDown.delay(index * 50).duration(300)}
                  style={[
                    styles.turbineRow,
                    layout.isTablet && styles.tabletTurbineRow,
                  ]}
                >
                  <View style={styles.turbineLabelRow}>
                    <View style={[styles.turbineBadge, { backgroundColor: theme.success + "20" }]}>
                      <ThemedText type="h4" style={{ color: theme.success }}>
                        {t}
                      </ThemedText>
                    </View>
                    <ThemedText type="body" style={styles.turbineLabel}>
                      {translate("turbine")} {t}
                    </ThemedText>
                  </View>

                  <View style={styles.inputRow}>
                    <NumericInputField
                      label={translate("previous")}
                      value={day.turbines[t]?.previous || ""}
                      onChangeValue={(v) =>
                        setDay((prev) => ({
                          ...prev,
                          turbines: {
                            ...prev.turbines,
                            [t]: { ...prev.turbines[t], previous: v },
                          },
                        }))
                      }
                      testID={`input-${t}-previous`}
                    />
                    <NumericInputField
                      label={translate("present")}
                      value={day.turbines[t]?.present || ""}
                      onChangeValue={(v) =>
                        setDay((prev) => ({
                          ...prev,
                          turbines: {
                            ...prev.turbines,
                            [t]: { ...prev.turbines[t], present: v },
                          },
                        }))
                      }
                      testID={`input-${t}-present`}
                    />
                    <HoursInputField
                      label={translate("hours")}
                      value={day.turbines[t]?.hours || "24"}
                      onChangeValue={(v) =>
                        setDay((prev) => ({
                          ...prev,
                          turbines: {
                            ...prev.turbines,
                            [t]: { ...prev.turbines[t], hours: v },
                          },
                        }))
                      }
                      testID={`input-${t}-hours`}
                    />
                  </View>

                  {hasError ? (
                    <View style={[styles.errorBox, { backgroundColor: "#fff1f3", borderColor: "#f04438" }]}>
                      <Feather name="alert-circle" size={16} color="#f04438" />
                      <ThemedText type="small" style={{ color: "#f04438", marginLeft: Spacing.xs }}>
                        {translate("turbine_error")}
                      </ThemedText>
                    </View>
                  ) : null}

                  <View style={styles.resultsRow}>
                    <View style={[styles.resultBox, { 
                      backgroundColor: hasError ? "#fff1f3" : theme.primary + "15", 
                      borderColor: hasError ? "#f04438" : theme.primary + "40" 
                    }]}>
                      <ThemedText type="caption" style={{ color: hasError ? "#f04438" : theme.primary }}>
                        {translate("difference")}
                      </ThemedText>
                      <ThemedText
                        type="h4"
                        style={{ color: hasError ? "#f04438" : theme.text, fontFamily: Typography.mono.fontFamily, ...numberTextStyle }}
                      >
                        {format2(Math.abs(row.diff))} {translate("mwh")}
                      </ThemedText>
                    </View>
                    <View style={[styles.resultBox, { backgroundColor: theme.success + "15", borderColor: theme.success + "40" }]}>
                      <ThemedText type="caption" style={{ color: theme.success }}>
                        {translate("mw_per_hr")}
                      </ThemedText>
                      <ThemedText
                        type="h4"
                        style={{ color: theme.text, fontFamily: Typography.mono.fontFamily, ...numberTextStyle }}
                      >
                        {format2(Math.abs(row.mwPerHr))}
                      </ThemedText>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(250).duration(300)}
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.success + "15",
              borderColor: theme.success,
            },
          ]}
        >
          <View style={[styles.summaryIconCircle, { backgroundColor: theme.success + "20" }]}>
            <Feather name="zap" size={28} color={theme.success} />
          </View>
          <ThemedText type="h4" style={{ color: theme.success, marginTop: Spacing.md }}>
            {translate("total_generation")}
          </ThemedText>
          <ThemedText
            type="h1"
            style={{
              color: theme.success,
              fontFamily: Typography.mono.fontFamily,
              marginTop: Spacing.xs,
              fontSize: 40,
              ...numberTextStyle,
            }}
          >
            {format2(Math.abs(totalProduction))}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
            {translate("mwh")}
          </ThemedText>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(300).duration(300)}
          style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
            <View style={[styles.iconCircle, { backgroundColor: theme.primary + "20" }]}>
              <Feather name="list" size={18} color={theme.primary} />
            </View>
            <ThemedText type="h3" style={{ marginLeft: Spacing.md }}>
              {translate("turbines_summary")}
            </ThemedText>
          </View>

          {rows.map((r, index) => (
            <View
              key={r.t}
              style={[
                styles.summaryRow,
                index < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
              ]}
            >
              <View style={[styles.turbineBadgeSmall, { backgroundColor: theme.success + "20" }]}>
                <ThemedText type="small" style={{ color: theme.success, fontWeight: "600" }}>
                  {r.t}
                </ThemedText>
              </View>
              <View style={styles.summaryValues}>
                <View style={styles.summaryValue}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {translate("prev_short")}
                  </ThemedText>
                  <ThemedText type="small" style={{ fontFamily: Typography.mono.fontFamily, ...numberTextStyle }}>
                    {format2(Math.abs(r.prev))}
                  </ThemedText>
                </View>
                <View style={styles.summaryValue}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {translate("pres_short")}
                  </ThemedText>
                  <ThemedText type="small" style={{ fontFamily: Typography.mono.fontFamily, ...numberTextStyle }}>
                    {format2(Math.abs(r.pres))}
                  </ThemedText>
                </View>
                <View style={styles.summaryValue}>
                  <ThemedText type="caption" style={{ color: theme.primary }}>
                    {translate("diff")}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={{ fontFamily: Typography.mono.fontFamily, color: theme.primary, fontWeight: "600", ...numberTextStyle }}
                  >
                    {format2(Math.abs(r.diff))}
                  </ThemedText>
                </View>
                <View style={styles.summaryValue}>
                  <ThemedText type="caption" style={{ color: theme.success }}>
                    {translate("mw_per_hr")}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={{ fontFamily: Typography.mono.fontFamily, color: theme.success, fontWeight: "600", ...numberTextStyle }}
                  >
                    {format2(Math.abs(r.mwPerHr))}
                  </ThemedText>
                </View>
              </View>
            </View>
          ))}
        </Animated.View>
      </KeyboardAwareScrollViewCompat>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  card: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  tabletGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: Spacing.sm,
  },
  tabletTurbineRow: {
    width: "50%",
    padding: Spacing.sm,
  },
  turbineRow: {
    padding: Spacing.lg,
  },
  turbineLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  turbineBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  turbineBadgeSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  turbineLabel: {
    marginLeft: Spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  inputGroup: {
    flex: 1,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    marginTop: Spacing.xs,
    fontFamily: Typography.mono.fontFamily,
  },
  resultsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  resultBox: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    alignItems: "center",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  summaryCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    borderWidth: 2,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  summaryIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  summaryValues: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    marginLeft: Spacing.md,
  },
  summaryValue: {
    alignItems: "center",
  },
  todayButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
  },
  letterCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  datePickerModal: {
    width: "100%",
    maxWidth: 380,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
  },
  dateNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  dateNavButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  dateDisplay: {
    alignItems: "center",
  },
  todayModalButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  dateModalInput: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    fontFamily: Typography.mono.fontFamily,
    textAlign: "center",
  },
});
