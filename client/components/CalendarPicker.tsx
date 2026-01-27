import React, { useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { formatDateKey } from "@/lib/storage";

interface CalendarPickerProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onClose: () => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getDayLetter(dateStr: string): string {
  const letters = ["B", "D", "A", "C"];
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "A";
  const epoch = new Date("2026-01-18");
  const diffDays = Math.floor((date.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24));
  const index = ((diffDays % 4) + 4) % 4;
  return letters[index];
}

export function CalendarPicker({ selectedDate, onSelectDate, onClose }: CalendarPickerProps) {
  const { theme } = useTheme();
  
  const currentDate = useMemo(() => {
    const d = new Date(selectedDate);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [selectedDate]);

  const [viewMonth, setViewMonth] = React.useState(currentDate.getMonth());
  const [viewYear, setViewYear] = React.useState(currentDate.getFullYear());

  const today = new Date();
  const todayStr = formatDateKey(today);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();
    
    const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];
    
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - 1, prevMonthLastDay - i);
      days.push({
        date: d,
        dateStr: formatDateKey(d),
        isCurrentMonth: false,
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(viewYear, viewMonth, i);
      days.push({
        date: d,
        dateStr: formatDateKey(d),
        isCurrentMonth: true,
      });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(viewYear, viewMonth + 1, i);
      days.push({
        date: d,
        dateStr: formatDateKey(d),
        isCurrentMonth: false,
      });
    }
    
    return days;
  }, [viewMonth, viewYear]);

  const handlePrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDate = (dateStr: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectDate(dateStr);
    onClose();
  };

  const handleGoToToday = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectDate(todayStr);
    onClose();
  };

  const dayLetter = getDayLetter(selectedDate);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
      <View style={styles.header}>
        <Pressable
          style={[styles.monthNavButton, { backgroundColor: theme.primary + "20" }]}
          onPress={handlePrevMonth}
        >
          <Feather name="chevron-left" size={20} color={theme.primary} />
        </Pressable>
        <View style={styles.monthYearDisplay}>
          <ThemedText type="h3" style={{ textAlign: "center" }}>
            {MONTHS[viewMonth]} {viewYear}
          </ThemedText>
        </View>
        <Pressable
          style={[styles.monthNavButton, { backgroundColor: theme.primary + "20" }]}
          onPress={handleNextMonth}
        >
          <Feather name="chevron-right" size={20} color={theme.primary} />
        </Pressable>
      </View>

      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
              {day}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {calendarDays.map((day, index) => {
          const isSelected = day.dateStr === selectedDate;
          const isToday = day.dateStr === todayStr;
          
          return (
            <Pressable
              key={index}
              style={[
                styles.dayCell,
                isSelected && { backgroundColor: theme.primary },
                isToday && !isSelected && { borderWidth: 2, borderColor: theme.primary },
              ]}
              onPress={() => handleSelectDate(day.dateStr)}
            >
              <ThemedText
                type="body"
                style={{
                  color: isSelected
                    ? "#fff"
                    : day.isCurrentMonth
                    ? theme.text
                    : theme.textSecondary + "60",
                  fontWeight: isSelected || isToday ? "600" : "400",
                  textAlign: "center",
                }}
              >
                {day.date.getDate()}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.selectedInfo, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Selected:{" "}
        </ThemedText>
        <ThemedText type="h4" style={{ fontFamily: Typography.mono.fontFamily }}>
          {selectedDate}
        </ThemedText>
        <View style={[styles.dayLetterBadge, { backgroundColor: theme.primary + "20" }]}>
          <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>
            Day {dayLetter}
          </ThemedText>
        </View>
      </View>

      <Pressable
        style={[styles.todayButton, { backgroundColor: theme.primary }]}
        onPress={handleGoToToday}
      >
        <Feather name="calendar" size={18} color="#fff" style={{ marginRight: Spacing.sm }} />
        <ThemedText type="body" style={{ color: "#fff", fontWeight: "600" }}>
          Go to Today
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: 340,
    maxWidth: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  monthNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  monthYearDisplay: {
    flex: 1,
    alignItems: "center",
  },
  weekdaysRow: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.full,
  },
  selectedInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    borderWidth: 1,
  },
  dayLetterBadge: {
    marginLeft: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  todayButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
});
