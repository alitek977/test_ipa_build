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
import { useTheme } from "@/hooks/useTheme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { Spacing, BorderRadius, Colors, Typography, Shadows } from "@/constants/theme";
import { useDay } from "@/contexts/DayContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRTL } from "@/hooks/useRTL";
import { FEEDERS, num, format2, numberTextStyle, formatDateKey, todayKey } from "@/lib/storage";
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

export default function FeedersScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const layout = useResponsiveLayout();
  const { dateKey, setDateKey, day, setDay, saveDay, resetDay } = useDay();
  const { t, isRTL } = useLanguage();
  const { rtlRow, rtlText } = useRTL();

  const rows = useMemo(() => {
    return FEEDERS.map((f) => {
      const start = num(day.feeders[f]?.start);
      const end = num(day.feeders[f]?.end);
      const diff = start - end;
      return { f, start, end, diff };
    });
  }, [day]);

  const total = rows.reduce((a, r) => a + r.diff, 0);
  const isExport = total >= 0;

  const [isSaving, setIsSaving] = useState(false);
  const saveLockRef = useRef(false);

  const handleSave = async () => {
    if (saveLockRef.current || isSaving) return;
    saveLockRef.current = true;
    setIsSaving(true);

    try {
      await saveDay();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccess(t("msg_saved_success"));
    } catch (error) {
      showError(t("msg_error_generic"));
    } finally {
      setIsSaving(false);
      saveLockRef.current = false;
    }
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetDay();
    showSuccess(t("msg_reset_done"));
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
              {isToday ? t("today") : dateKey}
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
              <Feather name="activity" size={18} color={theme.primary} />
            </View>
            <ThemedText type="h3" style={{ marginLeft: Spacing.md }}>
              {t("feeders_title")}
            </ThemedText>
          </View>

          <View style={layout.isTablet ? styles.tabletGrid : undefined}>
            {FEEDERS.map((f, index) => {
              const row = rows[index];
              return (
                <Animated.View
                  key={f}
                  entering={FadeInDown.delay(index * 50).duration(300)}
                  style={[
                    styles.feederRow,
                    layout.isTablet && styles.tabletFeederRow,
                  ]}
                >
                  <View style={[styles.feederLabelRow]}>
                    <View style={[styles.feederBadge, { backgroundColor: theme.primary + "20" }]}>
                      <ThemedText type="h4" style={{ color: theme.primary }}>
                        {f}
                      </ThemedText>
                    </View>
                    <ThemedText type="body" style={styles.feederLabel}>
                      {t("feeder")} {f}
                    </ThemedText>
                  </View>

                  <View style={styles.inputRow}>
                    <NumericInputField
                      label={t("start_of_day")}
                      value={day.feeders[f]?.start || ""}
                      onChangeValue={(v) =>
                        setDay((prev) => ({
                          ...prev,
                          feeders: {
                            ...prev.feeders,
                            [f]: { ...prev.feeders[f], start: v },
                          },
                        }))
                      }
                      testID={`input-${f}-start`}
                    />
                    <NumericInputField
                      label={t("end_of_day")}
                      value={day.feeders[f]?.end || ""}
                      onChangeValue={(v) =>
                        setDay((prev) => ({
                          ...prev,
                          feeders: {
                            ...prev.feeders,
                            [f]: { ...prev.feeders[f], end: v },
                          },
                        }))
                      }
                      testID={`input-${f}-end`}
                    />
                  </View>

                  <View style={[styles.diffBox, { backgroundColor: theme.primary + "15", borderColor: theme.primary + "40" }]}>
                    <ThemedText type="small" style={{ color: theme.primary }}>
                      {t("difference")}
                    </ThemedText>
                    <ThemedText
                      type="h2"
                      style={{ color: theme.text, fontFamily: Typography.mono.fontFamily, ...numberTextStyle }}
                    >
                      {format2(row.diff)}{" "}
                      <ThemedText type="body" style={{ color: theme.textSecondary }}>
                        {t("mw_unit")}
                      </ThemedText>
                    </ThemedText>
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
              backgroundColor: isExport ? "#ecfdf3" : "#fff1f3",
              borderColor: isExport ? "#12b76a" : "#f04438",
            },
          ]}
        >
          <View style={[styles.summaryIconCircle, { backgroundColor: isExport ? "#12b76a20" : "#f0443820" }]}>
            <Feather 
              name={isExport ? "arrow-up-right" : "arrow-down-left"} 
              size={28} 
              color={isExport ? "#12b76a" : "#f04438"} 
            />
          </View>
          <ThemedText
            type="h4"
            style={{ color: isExport ? "#12b76a" : "#f04438", fontWeight: "900", marginTop: Spacing.md }}
          >
            {isExport ? t("export") : t("withdrawal")}
          </ThemedText>
          <ThemedText
            type="h1"
            style={{
              color: isExport ? "#12b76a" : "#f04438",
              fontFamily: Typography.mono.fontFamily,
              fontWeight: "900",
              marginTop: Spacing.xs,
              fontSize: 40,
              ...numberTextStyle,
            }}
          >
            {format2(Math.abs(total))}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
            {isExport ? t("positive_energy_flow") : t("negative_energy_flow")}
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
              {t("feeders_summary")}
            </ThemedText>
          </View>

          {rows.map((r, index) => (
            <View
              key={r.f}
              style={[
                styles.summaryRow,
                index < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
              ]}
            >
              <View style={[styles.feederBadgeSmall, { backgroundColor: theme.primary + "20" }]}>
                <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>
                  {r.f}
                </ThemedText>
              </View>
              <View style={styles.summaryValues}>
                <View style={styles.summaryValue}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {t("start")}
                  </ThemedText>
                  <ThemedText type="body" style={{ fontFamily: Typography.mono.fontFamily }}>
                    {format2(r.start)}
                  </ThemedText>
                </View>
                <View style={styles.summaryValue}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {t("end")}
                  </ThemedText>
                  <ThemedText type="body" style={{ fontFamily: Typography.mono.fontFamily }}>
                    {format2(r.end)}
                  </ThemedText>
                </View>
                <View style={styles.summaryValue}>
                  <ThemedText type="caption" style={{ color: theme.primary }}>
                    {t("diff")}
                  </ThemedText>
                  <ThemedText
                    type="body"
                    style={{ fontFamily: Typography.mono.fontFamily, color: theme.primary, fontWeight: "600" }}
                  >
                    {format2(r.diff)}
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
  tabletFeederRow: {
    width: "50%",
    padding: Spacing.sm,
  },
  feederRow: {
    padding: Spacing.lg,
  },
  feederLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  feederBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  feederBadgeSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  feederLabel: {
    marginLeft: Spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    gap: Spacing.md,
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
  diffBox: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
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
