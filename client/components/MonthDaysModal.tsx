import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { format2 } from "@/lib/storage";
import {
  DaySummary,
  fetchMonthDaysFromSupabase,
  deleteDayFromSupabase,
} from "@/lib/supabaseSync";
import { showSuccess, showError } from "@/utils/notify";
import { deleteDayData } from "@/lib/storage";

interface MonthDaysModalProps {
  visible: boolean;
  monthKey: string;
  onClose: () => void;
  onDayDeleted: () => void;
}

export function MonthDaysModal({
  visible,
  monthKey,
  onClose,
  onDayDeleted,
}: MonthDaysModalProps) {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();

  const [days, setDays] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleteLockRef = useRef(false);

  useEffect(() => {
    if (visible && user) {
      loadDays();
    }
  }, [visible, monthKey, user]);

  const loadDays = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchMonthDaysFromSupabase(user.id, monthKey);
      setDays(data);
    } catch (error) {
      console.error("Error loading days:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (day: DaySummary) => {
    if (deleteLockRef.current || deletingId) return;

    Alert.alert(
      t("delete_day"),
      t("delete_day_confirm"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete_day"),
          style: "destructive",
          onPress: () => confirmDelete(day),
        },
      ]
    );
  };

  const confirmDelete = async (day: DaySummary) => {
    if (deleteLockRef.current || deletingId) return;
    deleteLockRef.current = true;
    setDeletingId(day.id);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const success = await deleteDayFromSupabase(day.id);

      if (success) {
        await deleteDayData(day.dateKey);

        setDays((prev) => prev.filter((d) => d.id !== day.id));
        showSuccess(t("day_deleted"));
        onDayDeleted();
      } else {
        showError(t("delete_failed"));
      }
    } catch (error) {
      console.error("Error deleting day:", error);
      showError(t("delete_failed"));
    } finally {
      setDeletingId(null);
      deleteLockRef.current = false;
    }
  };

  const formatMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString(isRTL ? "ar" : "en", {
      year: "numeric",
      month: "long",
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <View
            style={[styles.header, { borderBottomColor: theme.border }]}
          >
            <View style={styles.headerTitle}>
              <View
                style={[
                  styles.headerIcon,
                  { backgroundColor: theme.primary + "20" },
                ]}
              >
                <Feather name="calendar" size={18} color={theme.primary} />
              </View>
              <ThemedText type="h4" style={{ marginLeft: Spacing.sm }}>
                {t("month_days_title")} {formatMonthName(monthKey)}
              </ThemedText>
            </View>
            <Pressable
              style={[
                styles.closeButton,
                { backgroundColor: theme.backgroundSecondary },
              ]}
              onPress={onClose}
            >
              <Feather name="x" size={20} color={theme.text} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <ThemedText
                type="body"
                style={{ color: theme.textSecondary, marginTop: Spacing.md }}
              >
                {t("loading_days")}
              </ThemedText>
            </View>
          ) : days.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: theme.primary + "15" },
                ]}
              >
                <Feather name="inbox" size={32} color={theme.primary} />
              </View>
              <ThemedText
                type="body"
                style={{
                  color: theme.textSecondary,
                  marginTop: Spacing.lg,
                  textAlign: "center",
                }}
              >
                {t("no_days_in_month")}
              </ThemedText>
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {days.map((day) => {
                const isDeleting = deletingId === day.id;
                return (
                  <View
                    key={day.id}
                    style={[
                      styles.dayRow,
                      { backgroundColor: theme.backgroundSecondary },
                    ]}
                  >
                    <View style={styles.dayInfo}>
                      <ThemedText
                        type="body"
                        style={{
                          fontFamily: Typography.mono.fontFamily,
                          fontWeight: "600",
                        }}
                      >
                        {day.dateKey}
                      </ThemedText>
                      <View style={styles.dayStats}>
                        <View style={styles.dayStat}>
                          <View
                            style={[
                              styles.statDot,
                              { backgroundColor: theme.success },
                            ]}
                          />
                          <ThemedText
                            type="small"
                            style={{ color: theme.textSecondary }}
                          >
                            {t("production")}:
                          </ThemedText>
                          <ThemedText
                            type="small"
                            style={{
                              fontFamily: Typography.mono.fontFamily,
                              marginLeft: 4,
                            }}
                          >
                            {format2(day.production)} {t("mwh")}
                          </ThemedText>
                        </View>
                        <View style={styles.dayStat}>
                          <View
                            style={[
                              styles.statDot,
                              { backgroundColor: theme.primary },
                            ]}
                          />
                          <ThemedText
                            type="small"
                            style={{ color: theme.textSecondary }}
                          >
                            {t("export")}:
                          </ThemedText>
                          <ThemedText
                            type="small"
                            style={{
                              fontFamily: Typography.mono.fontFamily,
                              marginLeft: 4,
                            }}
                          >
                            {format2(day.exportVal)} {t("mwh")}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                    <Pressable
                      style={[
                        styles.deleteButton,
                        { backgroundColor: "#f04438" + "20" },
                        isDeleting && { opacity: 0.5 },
                      ]}
                      onPress={() => handleDelete(day)}
                      disabled={isDeleting || deletingId !== null}
                    >
                      {isDeleting ? (
                        <ActivityIndicator size="small" color="#f04438" />
                      ) : (
                        <Feather name="trash-2" size={18} color="#f04438" />
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "80%",
    minHeight: 300,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"],
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"],
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  dayInfo: {
    flex: 1,
  },
  dayStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  dayStat: {
    flexDirection: "row",
    alignItems: "center",
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.md,
  },
});
