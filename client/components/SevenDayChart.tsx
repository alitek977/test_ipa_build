import React, { useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Svg, { Line, Rect, Circle, Text as SvgText, G } from "react-native-svg";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import {
  DayData,
  turbineProductionMwh,
  feederExport,
  turbineRowComputed,
  gasForTurbine,
  TURBINES,
} from "@/lib/storage";

interface ChartDataPoint {
  dateKey: string;
  label: string;
  production: number;
  consumption: number;
  exportVal: number;
  isExport: boolean;
  gasConsumed: number;
}

interface SevenDayChartProps {
  days: DayData[];
}

function computeDayStats(day: DayData): Omit<ChartDataPoint, "label"> {
  const production = turbineProductionMwh(day);
  const exportVal = feederExport(day);
  const consumption = production - exportVal;
  const isExport = exportVal >= 0;

  let totalGas = 0;
  for (const t of TURBINES) {
    const row = turbineRowComputed(day, t);
    totalGas += gasForTurbine(row.diff, row.mwPerHr);
  }

  return {
    dateKey: day.dateKey,
    production,
    consumption,
    exportVal,
    isExport,
    gasConsumed: totalGas,
  };
}

function formatDateLabel(dateKey: string, language: string): string {
  const date = new Date(dateKey);
  if (isNaN(date.getTime())) return dateKey;

  const day = date.getDate();
  const month = date.getMonth() + 1;

  if (language === "ar") {
    return `${day}/${month}`;
  }
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[date.getMonth()]} ${day}`;
}

export function SevenDayChart({ days }: SevenDayChartProps) {
  const { theme } = useTheme();
  const { t, language, isRTL } = useLanguage();

  const chartData = useMemo(() => {
    const sorted = [...days]
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
      .slice(0, 7)
      .reverse();

    return sorted.map((day) => ({
      ...computeDayStats(day),
      label: formatDateLabel(day.dateKey, language),
    }));
  }, [days, language]);

  const hasWithdrawal = useMemo(() => {
    return chartData.some((d) => !d.isExport);
  }, [chartData]);

  const flowLabel = hasWithdrawal ? t("export") + "/" + t("withdrawal") : t("export");

  if (chartData.length === 0) {
    return (
      <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
        <View style={[styles.emptyIconCircle, { backgroundColor: theme.primary + "15" }]}>
          <Feather name="bar-chart-2" size={32} color={theme.primary} />
        </View>
        <ThemedText type="body" style={{ color: theme.text, marginTop: Spacing.lg, fontWeight: "600" }}>
          {t("no_chart_data")}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.xs }}>
          {t("save_data_for_chart")}
        </ThemedText>
      </View>
    );
  }

  const screenWidth = Dimensions.get("window").width;
  const chartWidth = Math.min(screenWidth - Spacing.lg * 4, 500);
  const chartHeight = 200;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 40;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const maxProduction = Math.max(...chartData.map((d) => d.production), 1);
  const maxConsumption = Math.max(...chartData.map((d) => d.consumption), 1);
  const maxExport = Math.max(...chartData.map((d) => Math.abs(d.exportVal)), 1);
  const maxEnergy = Math.max(maxProduction, maxConsumption, maxExport) * 1.1;

  const maxGas = Math.max(...chartData.map((d) => d.gasConsumed), 1) * 1.1;

  const barWidth = plotWidth / chartData.length / 3;
  const barGap = barWidth * 0.3;

  const getX = (index: number) => {
    const step = plotWidth / (chartData.length);
    return paddingLeft + step * index + step / 2;
  };

  const getY = (value: number, max: number) => {
    return paddingTop + plotHeight - (value / max) * plotHeight;
  };

  const colors = {
    production: theme.success,
    consumption: theme.warning,
    export: "#12b76a",
    withdrawal: "#f04438",
    gas: "#6366f1",
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
      <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
        <View style={[styles.iconCircle, { backgroundColor: theme.primary + "20" }]}>
          <Feather name="trending-up" size={18} color={theme.primary} />
        </View>
        <ThemedText type="h4" style={{ marginLeft: Spacing.md }}>
          {t("last_7_days")}
        </ThemedText>
      </View>

      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <Line
              key={ratio}
              x1={paddingLeft}
              y1={paddingTop + plotHeight * (1 - ratio)}
              x2={chartWidth - paddingRight}
              y2={paddingTop + plotHeight * (1 - ratio)}
              stroke={theme.border}
              strokeWidth={1}
              strokeDasharray={ratio === 0 ? "0" : "4,4"}
            />
          ))}

          {chartData.map((d, i) => {
            const x = getX(i);
            const exportColor = d.isExport ? colors.export : colors.withdrawal;
            const exportBarHeight = (Math.abs(d.exportVal) / maxEnergy) * plotHeight;
            const gasBarHeight = (d.gasConsumed / maxGas) * plotHeight;

            return (
              <G key={d.dateKey}>
                <Rect
                  x={x - barWidth - barGap / 2}
                  y={getY(Math.abs(d.exportVal), maxEnergy)}
                  width={barWidth}
                  height={exportBarHeight}
                  fill={exportColor}
                  rx={2}
                />
                <Rect
                  x={x + barGap / 2}
                  y={getY(d.gasConsumed, maxGas)}
                  width={barWidth}
                  height={gasBarHeight}
                  fill={colors.gas}
                  rx={2}
                  opacity={0.7}
                />
              </G>
            );
          })}

          {chartData.length > 1 ? (
            <>
              {chartData.map((d, i) => {
                if (i === 0) return null;
                const prev = chartData[i - 1];
                return (
                  <Line
                    key={`prod-line-${i}`}
                    x1={getX(i - 1)}
                    y1={getY(prev.production, maxEnergy)}
                    x2={getX(i)}
                    y2={getY(d.production, maxEnergy)}
                    stroke={colors.production}
                    strokeWidth={2}
                  />
                );
              })}
              {chartData.map((d, i) => {
                if (i === 0) return null;
                const prev = chartData[i - 1];
                return (
                  <Line
                    key={`cons-line-${i}`}
                    x1={getX(i - 1)}
                    y1={getY(prev.consumption, maxEnergy)}
                    x2={getX(i)}
                    y2={getY(d.consumption, maxEnergy)}
                    stroke={colors.consumption}
                    strokeWidth={2}
                  />
                );
              })}
            </>
          ) : null}

          {chartData.map((d, i) => (
            <G key={`dots-${d.dateKey}`}>
              <Circle cx={getX(i)} cy={getY(d.production, maxEnergy)} r={4} fill={colors.production} />
              <Circle cx={getX(i)} cy={getY(d.consumption, maxEnergy)} r={4} fill={colors.consumption} />
            </G>
          ))}

          {chartData.map((d, i) => (
            <SvgText
              key={`label-${d.dateKey}`}
              x={getX(i)}
              y={chartHeight - 8}
              fontSize={10}
              fill={theme.textSecondary}
              textAnchor="middle"
            >
              {d.label}
            </SvgText>
          ))}

          {[0, 0.5, 1].map((ratio) => (
            <SvgText
              key={`y-${ratio}`}
              x={paddingLeft - 5}
              y={paddingTop + plotHeight * (1 - ratio) + 4}
              fontSize={9}
              fill={theme.textSecondary}
              textAnchor="end"
            >
              {Math.round(maxEnergy * ratio)}
            </SvgText>
          ))}
        </Svg>
      </View>

      <View style={[styles.legendContainer, isRTL && styles.legendContainerRTL]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.production }]} />
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {t("production")}
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.consumption }]} />
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {t("consumption")}
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendRect, { backgroundColor: colors.export }]} />
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {flowLabel}
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendRect, { backgroundColor: colors.gas }]} />
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {t("gas_consumed")}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  chartContainer: {
    padding: Spacing.md,
    alignItems: "center",
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  legendContainerRTL: {
    flexDirection: "row-reverse",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendRect: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  emptyState: {
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
