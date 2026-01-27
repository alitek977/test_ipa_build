import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { SevenDayChart } from "@/components/SevenDayChart";
import { MonthDaysModal } from "@/components/MonthDaysModal";
import { useTheme } from "@/hooks/useTheme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useDay } from "@/contexts/DayContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRTL } from "@/hooks/useRTL";
import { getFlowLabelAndStyle } from "@/lib/flowLabel";
import {
  DayData,
  getAllDaysData,
  feederExport,
  turbineProductionMwh,
  exportAllData,
  format2,
  monthKey,
  numberTextStyle,
} from "@/lib/storage";
import { generateExcelReport, generateTextReport } from "@/lib/excelExport";

interface MonthlyStats {
  month: string;
  days: number;
  totalProduction: number;
  totalExport: number;
  totalConsumption: number;
}

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const layout = useResponsiveLayout();
  const { dateKey, day } = useDay();
  const { language, t, isRTL } = useLanguage();
  const { rtlRow, rtlText } = useRTL();

  const [allDays, setAllDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [monthModalVisible, setMonthModalVisible] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    const days = await getAllDaysData();
    setAllDays(days);
    setLoading(false);
  };

  const currentDayStats = useMemo(() => {
    const production = turbineProductionMwh(day);
    const exportVal = feederExport(day);
    const consumption = production - exportVal;
    const isExport = exportVal >= 0;
    return { production, exportVal, consumption, isExport };
  }, [day]);

  const monthlyStats = useMemo(() => {
    const monthMap = new Map<string, MonthlyStats>();

    allDays.forEach((d) => {
      const month = monthKey(d.dateKey);
      const production = turbineProductionMwh(d);
      const exportVal = feederExport(d);
      const consumption = production - exportVal;

      if (!monthMap.has(month)) {
        monthMap.set(month, {
          month,
          days: 0,
          totalProduction: 0,
          totalExport: 0,
          totalConsumption: 0,
        });
      }

      const stats = monthMap.get(month)!;
      stats.days += 1;
      stats.totalProduction += production;
      stats.totalExport += exportVal;
      stats.totalConsumption += consumption;
    });

    return Array.from(monthMap.values()).sort((a, b) => b.month.localeCompare(a.month));
  }, [allDays]);

  const handleTextExport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await generateTextReport(day, t, language);
    } catch (error) {
      Alert.alert(t("error"), t("failed_export"));
    }
  };

  const handleOpenMonthModal = (month: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMonth(month);
    setMonthModalVisible(true);
  };

  const handleMonthDayDeleted = () => {
    loadAllData();
  };

  const handleCopyToClipboard = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const jsonData = await exportAllData();
      await Clipboard.setStringAsync(jsonData);
      Alert.alert(t("copied"), t("data_copied"));
    } catch (error) {
      Alert.alert(t("error"), t("failed_copy"));
    }
  };

  const handleExcelExport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await generateExcelReport(day, allDays, t, language);
    } catch (error) {
      Alert.alert(t("error"), t("failed_export"));
    }
  };

  const flexRowStyle = isRTL ? styles.flexRowRTL : styles.flexRow;

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
      >
        <Animated.View entering={FadeInDown.duration(300)}>
          <SevenDayChart days={allDays} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            {t("current_day_report")}
          </ThemedText>
          <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: theme.primary + "20" }]}>
                <Feather name="calendar" size={18} color={theme.primary} />
              </View>
              <ThemedText type="h4" style={{ marginLeft: Spacing.md }}>
                {dateKey}
              </ThemedText>
            </View>

            <View style={[styles.statsGrid, layout.isTablet && styles.tabletStatsGrid]}>
              <View style={[styles.statItem, { backgroundColor: theme.success + "15" }]}>
                <View style={[styles.statIconCircle, { backgroundColor: theme.success + "20" }]}>
                  <Feather name="zap" size={18} color={theme.success} />
                </View>
                <ThemedText type="caption" style={{ color: theme.success, marginTop: Spacing.sm }}>
                  {t("production")}
                </ThemedText>
                <ThemedText type="h3" style={{ color: theme.success, fontFamily: Typography.mono.fontFamily, ...numberTextStyle }}>
                  {format2(currentDayStats.production)}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {t("mwh")}
                </ThemedText>
              </View>

              {(() => {
                const flowStyle = getFlowLabelAndStyle(currentDayStats.isExport, t, theme);
                return (
                  <View style={[styles.statItem, { backgroundColor: flowStyle.color + "15" }]}>
                    <View style={[styles.statIconCircle, { backgroundColor: flowStyle.color + "20" }]}>
                      <Feather name={currentDayStats.isExport ? "arrow-up-right" : "arrow-down-left"} size={18} color={flowStyle.color} />
                    </View>
                    <ThemedText type="caption" style={{ color: flowStyle.color, marginTop: Spacing.sm }}>
                      {flowStyle.text}
                    </ThemedText>
                    <ThemedText type="h3" style={{ color: flowStyle.color, fontFamily: Typography.mono.fontFamily, ...numberTextStyle }}>
                      {format2(Math.abs(currentDayStats.exportVal))}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      {t("mwh")}
                    </ThemedText>
                  </View>
                );
              })()}

              <View style={[styles.statItem, { backgroundColor: theme.warning + "15" }]}>
                <View style={[styles.statIconCircle, { backgroundColor: theme.warning + "20" }]}>
                  <Feather name="home" size={18} color={theme.warning} />
                </View>
                <ThemedText type="caption" style={{ color: theme.warning, marginTop: Spacing.sm }}>
                  {t("consumption")}
                </ThemedText>
                <ThemedText type="h3" style={{ color: theme.warning, fontFamily: Typography.mono.fontFamily, ...numberTextStyle }}>
                  {format2(currentDayStats.consumption)}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {t("mwh")}
                </ThemedText>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            {t("monthly_statistics")}
          </ThemedText>

          {monthlyStats.length > 0 ? (
            <View style={layout.isTablet ? styles.tabletMonthGrid : undefined}>
              {monthlyStats.map((stats, index) => (
                <Animated.View
                  key={stats.month}
                  entering={FadeInDown.delay(150 + index * 50).duration(300)}
                  style={[
                    layout.isTablet && styles.tabletMonthCard
                  ]}
                >
                  <Pressable
                    style={[
                      styles.card, 
                      { backgroundColor: theme.backgroundDefault, marginBottom: Spacing.md },
                    ]}
                    onPress={() => handleOpenMonthModal(stats.month)}
                  >
                    <View style={[styles.monthHeader, { borderBottomColor: theme.border }]}>
                      <View style={styles.monthTitleRow}>
                        <View style={[styles.monthBadge, { backgroundColor: theme.primary + "20" }]}>
                          <Feather name="calendar" size={14} color={theme.primary} />
                        </View>
                        <ThemedText type="h4" style={{ marginLeft: Spacing.sm }}>{stats.month}</ThemedText>
                      </View>
                      <View style={[styles.daysBadge, { backgroundColor: theme.backgroundSecondary }]}>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          {stats.days} {stats.days !== 1 ? t("days_plural") : t("day_singular")}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.monthStats}>
                      <View style={styles.monthStatItem}>
                        <View style={[styles.monthStatDot, { backgroundColor: theme.success }]} />
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                          {t("production")}
                        </ThemedText>
                        <ThemedText type="body" style={{ fontFamily: Typography.mono.fontFamily, fontWeight: "600", ...numberTextStyle }}>
                          {format2(stats.totalProduction)}
                        </ThemedText>
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>{t("mwh")}</ThemedText>
                      </View>
                      <View style={styles.monthStatItem}>
                        <View style={[styles.monthStatDot, { backgroundColor: theme.primary }]} />
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                          {t("export")}
                        </ThemedText>
                        <ThemedText type="body" style={{ fontFamily: Typography.mono.fontFamily, fontWeight: "600", ...numberTextStyle }}>
                          {format2(stats.totalExport)}
                        </ThemedText>
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>{t("mwh")}</ThemedText>
                      </View>
                      <View style={styles.monthStatItem}>
                        <View style={[styles.monthStatDot, { backgroundColor: theme.warning }]} />
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                          {t("consumption")}
                        </ThemedText>
                        <ThemedText type="body" style={{ fontFamily: Typography.mono.fontFamily, fontWeight: "600", ...numberTextStyle }}>
                          {format2(stats.totalConsumption)}
                        </ThemedText>
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>{t("mwh")}</ThemedText>
                      </View>
                    </View>

                    <View style={[styles.tapHint, { borderTopColor: theme.border }]}>
                      <Feather name="chevron-up" size={14} color={theme.textSecondary} />
                      <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
                        {t("tap_to_view")}
                      </ThemedText>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.primary + "15" }]}>
                <Feather name="inbox" size={32} color={theme.primary} />
              </View>
              <ThemedText type="body" style={{ color: theme.text, marginTop: Spacing.lg, fontWeight: "600" }}>
                {t("no_historical_data")}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.xs }}>
                {t("save_first_day_hint")}
              </ThemedText>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(300)}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            {t("data_management")}
          </ThemedText>

          <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
            <Pressable
              style={[styles.actionRow, { borderBottomWidth: 1, borderBottomColor: theme.border }]}
              onPress={handleExcelExport}
              testID="button-export-excel"
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.success + "20" }]}>
                <Feather name="file-text" size={20} color={theme.success} />
              </View>
              <View style={styles.actionText}>
                <ThemedText type="body" style={{ fontFamily: Typography.h4.fontFamily }}>
                  {t("export_excel")}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {t("share_as_excel")}
                </ThemedText>
              </View>
              <View style={[styles.actionArrow, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="chevron-right" size={18} color={theme.textSecondary} />
              </View>
            </Pressable>

            <Pressable
              style={[styles.actionRow, { borderBottomWidth: 1, borderBottomColor: theme.border }]}
              onPress={handleTextExport}
              testID="button-export"
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.primary + "20" }]}>
                <Feather name="file-text" size={20} color={theme.primary} />
              </View>
              <View style={styles.actionText}>
                <ThemedText type="body" style={{ fontFamily: Typography.h4.fontFamily }}>
                  {t("export_txt")}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {t("share_as_txt")}
                </ThemedText>
              </View>
              <View style={[styles.actionArrow, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="chevron-right" size={18} color={theme.textSecondary} />
              </View>
            </Pressable>

            <Pressable
              style={styles.actionRow}
              onPress={handleCopyToClipboard}
              testID="button-copy"
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.success + "20" }]}>
                <Feather name="copy" size={20} color={theme.success} />
              </View>
              <View style={styles.actionText}>
                <ThemedText type="body" style={{ fontFamily: Typography.h4.fontFamily }}>
                  {t("copy_to_clipboard")}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {t("copy_all_data")}
                </ThemedText>
              </View>
              <View style={[styles.actionArrow, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="chevron-right" size={18} color={theme.textSecondary} />
              </View>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <View style={[styles.footerBadge, { backgroundColor: theme.backgroundDefault }]}>
              <Feather name="database" size={14} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
                {allDays.length} {allDays.length !== 1 ? t("days_plural") : t("day_singular")} {t("days_stored")}
              </ThemedText>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {selectedMonth && (
        <MonthDaysModal
          visible={monthModalVisible}
          monthKey={selectedMonth}
          onClose={() => setMonthModalVisible(false)}
          onDayDeleted={handleMonthDayDeleted}
        />
      )}
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
  statsGrid: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  tabletStatsGrid: {
    flexWrap: "wrap",
  },
  statItem: {
    flex: 1,
    minWidth: 100,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  tabletMonthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  tabletMonthCard: {
    width: "48%",
    flexGrow: 1,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  monthTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  monthBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  daysBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  monthStats: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  monthStatItem: {
    flex: 1,
    alignItems: "center",
  },
  monthStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: Spacing.xs,
  },
  emptyState: {
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  actionArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    alignItems: "center",
    padding: Spacing.lg,
  },
  footerBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  flexRow: {
    flexDirection: "row",
  },
  flexRowRTL: {
    flexDirection: "row-reverse",
  },
  tapHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
});
