import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useDay } from "@/contexts/DayContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRTL } from "@/hooks/useRTL";
import { getFlowLabelAndStyle } from "@/lib/flowLabel";
import {
  TURBINES,
  format2,
  format4,
  feederExport,
  turbineProductionMwh,
  turbineRowComputed,
  gasForTurbine,
  m3ToMMscf,
  numberTextStyle,
} from "@/lib/storage";

interface StatCardProps {
  title: string;
  value: string;
  unit: string;
  subtitle?: string;
  tone?: "blue" | "green" | "red" | "yellow";
  icon?: string;
  fullWidth?: boolean;
}

function StatCard({ title, value, unit, subtitle, tone = "blue", icon, fullWidth }: StatCardProps) {
  const { theme } = useTheme();

  const colors = {
    blue: theme.primary,
    green: theme.success,
    red: theme.error,
    yellow: theme.warning,
  };

  const color = colors[tone];

  return (
    <View style={[styles.statCard, fullWidth && styles.statCardFull, { backgroundColor: color + "15", borderColor: color }]}>
      {icon ? (
        <View style={[styles.statIconCircle, { backgroundColor: color + "20" }]}>
          <Feather name={icon as any} size={20} color={color} />
        </View>
      ) : null}
      <ThemedText type="small" style={{ color, marginTop: icon ? Spacing.sm : 0 }}>
        {title}
      </ThemedText>
      <View style={styles.statValueRow}>
        <ThemedText type="h2" style={{ color, fontFamily: Typography.mono.fontFamily, ...numberTextStyle }}>
          {value}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
          {unit}
        </ThemedText>
      </View>
      {subtitle ? (
        <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
          {subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}

export default function CalculationsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const layout = useResponsiveLayout();
  const { day, dateKey } = useDay();
  const { t, isRTL } = useLanguage();
  const { rtlRow, rtlText } = useRTL();

  const calculations = useMemo(() => {
    const production = turbineProductionMwh(day);
    const exportVal = feederExport(day);
    const consumption = production - exportVal;

    const turbineData = TURBINES.map((t) => {
      const computed = turbineRowComputed(day, t);
      const gasM3 = gasForTurbine(computed.diff, computed.mwPerHr);
      const gasMMscf = m3ToMMscf(gasM3);
      return {
        t,
        ...computed,
        gasM3,
        gasMMscf,
      };
    });

    const totalGasM3 = turbineData.reduce((a, r) => a + r.gasM3, 0);
    const totalGasMMscf = turbineData.reduce((a, r) => a + r.gasMMscf, 0);

    return {
      production,
      exportVal,
      consumption,
      turbineData,
      totalGasM3,
      totalGasMMscf,
    };
  }, [day]);

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
        <Animated.View entering={FadeInDown.duration(300)} style={styles.dateHeader}>
          <View style={[styles.dateIconCircle, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="calendar" size={16} color={theme.primary} />
          </View>
          <ThemedText type="body" style={{ marginLeft: Spacing.md, color: theme.textSecondary }}>
            {t("calculations_for")}{" "}
            <ThemedText type="body" style={{ color: theme.text, fontFamily: Typography.h4.fontFamily }}>
              {dateKey}
            </ThemedText>
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(50).duration(300)}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            {t("energy_summary")}
          </ThemedText>
          <View style={layout.isTablet ? styles.tabletStatsGrid : styles.mobileStatsStack}>
            <StatCard
              title={t("production")}
              value={format2(calculations.production)}
              unit={t("mwh")}
              tone="green"
              icon="zap"
              fullWidth={!layout.isTablet}
            />
            <StatCard
              title={getFlowLabelAndStyle(calculations.exportVal >= 0, t, theme).text}
              value={format2(Math.abs(calculations.exportVal))}
              unit={t("mwh")}
              tone={getFlowLabelAndStyle(calculations.exportVal >= 0, t, theme).tone}
              icon={calculations.exportVal >= 0 ? "arrow-up-right" : "arrow-down-left"}
              fullWidth={!layout.isTablet}
            />
            <StatCard
              title={t("consumption")}
              value={format2(calculations.consumption)}
              unit={t("mwh")}
              tone="yellow"
              icon="home"
              fullWidth={!layout.isTablet}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(300)}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            {t("gas_consumption")}
          </ThemedText>

          <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: theme.warning + "20" }]}>
                <Feather name="droplet" size={18} color={theme.warning} />
              </View>
              <ThemedText type="h4" style={{ marginLeft: Spacing.md }}>
                {t("per_turbine")}
              </ThemedText>
            </View>

            <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
              <ThemedText type="caption" style={[styles.tableCell, { flex: 0.8, color: theme.textSecondary }]}>
                {t("turbine")}
              </ThemedText>
              <ThemedText type="caption" style={[styles.tableCell, { color: theme.textSecondary }]}>
                {t("diff_mwh")}
              </ThemedText>
              <ThemedText type="caption" style={[styles.tableCell, { color: theme.textSecondary }]}>
                {t("mw_per_hr")}
              </ThemedText>
              <ThemedText type="caption" style={[styles.tableCell, { color: theme.textSecondary }]}>
                {t("gas_m3")}
              </ThemedText>
              <ThemedText type="caption" style={[styles.tableCell, { color: theme.textSecondary }]}>
                MMscf
              </ThemedText>
            </View>

            {calculations.turbineData.map((r, index) => (
              <View
                key={r.t}
                style={[
                  styles.tableRow,
                  index < calculations.turbineData.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  },
                ]}
              >
                <View style={[styles.tableCell, { flex: 0.8, flexDirection: "row", alignItems: "center" }]}>
                  <View style={[styles.turbineBadgeSmall, { backgroundColor: theme.success + "20" }]}>
                    <ThemedText type="caption" style={{ color: theme.success, fontWeight: "600" }}>
                      {r.t}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText type="small" style={[styles.tableCell, { fontFamily: Typography.mono.fontFamily, ...numberTextStyle }]}>
                  {format2(r.diff)}
                </ThemedText>
                <ThemedText type="small" style={[styles.tableCell, { fontFamily: Typography.mono.fontFamily, ...numberTextStyle }]}>
                  {format2(r.mwPerHr)}
                </ThemedText>
                <ThemedText type="small" style={[styles.tableCell, { fontFamily: Typography.mono.fontFamily, color: theme.warning, ...numberTextStyle }]}>
                  {format2(r.gasM3)}
                </ThemedText>
                <ThemedText type="small" style={[styles.tableCell, { fontFamily: Typography.mono.fontFamily, color: theme.warning, ...numberTextStyle }]}>
                  {format4(r.gasMMscf)}
                </ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.statsRow}>
            <StatCard
              title={t("total_gas")}
              value={format2(calculations.totalGasM3)}
              unit="m³"
              tone="yellow"
              icon="droplet"
            />
            <StatCard
              title={t("total_gas")}
              value={format4(calculations.totalGasMMscf)}
              unit="MMscf"
              tone="yellow"
              icon="droplet"
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(300)}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            {t("formula_reference")}
          </ThemedText>

          <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.formulaRow, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
              <View style={styles.formulaLabelRow}>
                <View style={[styles.formulaDot, { backgroundColor: theme.success }]} />
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {t("production")}
                </ThemedText>
              </View>
              <ThemedText type="body" style={{ fontFamily: Typography.mono.fontFamily, color: theme.primary }}>
                {t("sum_turbine_diff")}
              </ThemedText>
            </View>
            <View style={[styles.formulaRow, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
              <View style={styles.formulaLabelRow}>
                <View style={[styles.formulaDot, { backgroundColor: theme.primary }]} />
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {t("export_withdrawal_label")}
                </ThemedText>
              </View>
              <ThemedText type="body" style={{ fontFamily: Typography.mono.fontFamily, color: theme.primary }}>
                {t("sum_feeder_diff")}
              </ThemedText>
            </View>
            <View style={[styles.formulaRow, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
              <View style={styles.formulaLabelRow}>
                <View style={[styles.formulaDot, { backgroundColor: theme.warning }]} />
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {t("consumption")}
                </ThemedText>
              </View>
              <ThemedText type="body" style={{ fontFamily: Typography.mono.fontFamily, color: theme.primary }}>
                {t("production_minus_export")}
              </ThemedText>
            </View>
            <View style={styles.formulaRow}>
              <View style={styles.formulaLabelRow}>
                <View style={[styles.formulaDot, { backgroundColor: theme.warning }]} />
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {t("gas_formula")}
                </ThemedText>
              </View>
              <View style={styles.gasFormulas}>
                <View style={styles.gasFormulaRow}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>MW/h ≤ 3:</ThemedText>
                  <ThemedText type="caption" style={{ color: theme.warning, fontFamily: Typography.mono.fontFamily }}>
                    Diff × 1000
                  </ThemedText>
                </View>
                <View style={styles.gasFormulaRow}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>MW/h ≤ 5:</ThemedText>
                  <ThemedText type="caption" style={{ color: theme.warning, fontFamily: Typography.mono.fontFamily }}>
                    Diff × 700
                  </ThemedText>
                </View>
                <View style={styles.gasFormulaRow}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>MW/h ≤ 8:</ThemedText>
                  <ThemedText type="caption" style={{ color: theme.warning, fontFamily: Typography.mono.fontFamily }}>
                    Diff × 500
                  </ThemedText>
                </View>
                <View style={styles.gasFormulaRow}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>{"MW/h > 8:"}</ThemedText>
                  <ThemedText type="caption" style={{ color: theme.warning, fontFamily: Typography.mono.fontFamily }}>
                    Diff × 420
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
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
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  dateIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  mobileStatsStack: {
    flexDirection: "column",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  tabletStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: "center",
  },
  statCardFull: {
    flex: undefined,
    width: "100%",
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: Spacing.xs,
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
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  tableCell: {
    flex: 1,
    textAlign: "center",
  },
  turbineBadgeSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  formulaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: Spacing.lg,
  },
  formulaLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  formulaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  gasFormulas: {
    alignItems: "flex-end",
  },
  gasFormulaRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
});
