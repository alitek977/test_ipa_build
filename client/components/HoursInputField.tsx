import React, { useState } from "react";
import { View, StyleSheet, Pressable, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

interface HoursInputFieldProps {
  label: string;
  value: string;
  onChangeValue: (value: string) => void;
  testID?: string;
}

const KEYS = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["", "0", "⌫"],
];

function clampHours(val: string): string {
  if (!val || val === "") return "24";
  const num = parseInt(val, 10);
  if (isNaN(num) || num < 1) return "1";
  if (num > 24) return "24";
  return String(num);
}

export function HoursInputField({ label, value, onChangeValue, testID }: HoursInputFieldProps) {
  const { theme } = useTheme();
  const [showKeypad, setShowKeypad] = useState(false);
  const [tempValue, setTempValue] = useState("");

  const displayValue = value || "24";

  const handleOpen = () => {
    setTempValue("");
    setShowKeypad(true);
  };

  const handleKeyPress = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (key === "⌫") {
      setTempValue((prev) => prev.slice(0, -1));
      return;
    }
    
    if (key === "") return;
    
    const newValue = tempValue + key;
    const num = parseInt(newValue, 10);
    if (num > 24) {
      setTempValue("24");
    } else if (newValue.length <= 2) {
      setTempValue(newValue);
    }
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTempValue("");
  };

  const handleDone = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const clamped = clampHours(tempValue);
    onChangeValue(clamped);
    setShowKeypad(false);
  };

  const handleClose = () => {
    const clamped = clampHours(tempValue);
    onChangeValue(clamped);
    setShowKeypad(false);
  };

  return (
    <>
      <Pressable
        style={[
          styles.container,
          { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
        ]}
        onPress={handleOpen}
        testID={testID}
      >
        <ThemedText type="caption" style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </ThemedText>
        <ThemedText
          type="body"
          style={[
            styles.value,
            { color: theme.text, fontFamily: Typography.mono.fontFamily },
          ]}
        >
          {displayValue}
        </ThemedText>
      </Pressable>

      <Modal
        visible={showKeypad}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable style={[styles.keypadContainer, { backgroundColor: theme.backgroundDefault }]} onPress={(e) => e.stopPropagation()}>
            <ThemedText type="small" style={[styles.keypadLabel, { color: theme.textSecondary }]}>
              {label} (1-24)
            </ThemedText>
            
            <View style={[styles.display, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
              <ThemedText type="h2" style={[styles.displayText, { fontFamily: Typography.mono.fontFamily }]}>
                {tempValue || "0"}
              </ThemedText>
            </View>

            <View style={styles.keysContainer}>
              {KEYS.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.keyRow}>
                  {row.map((key, keyIndex) => (
                    <Pressable
                      key={`${rowIndex}-${keyIndex}`}
                      style={[
                        styles.key,
                        { 
                          backgroundColor: key === "⌫" 
                            ? theme.error + "20" 
                            : key === "" 
                              ? "transparent" 
                              : theme.backgroundSecondary 
                        },
                      ]}
                      onPress={() => handleKeyPress(key)}
                      disabled={key === ""}
                    >
                      {key === "⌫" ? (
                        <Feather name="delete" size={24} color={theme.error} />
                      ) : (
                        <ThemedText type="h3" style={{ fontFamily: Typography.mono.fontFamily }}>
                          {key}
                        </ThemedText>
                      )}
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>

            <View style={styles.actionRow}>
              <Pressable
                style={[styles.actionButton, { backgroundColor: theme.error + "20" }]}
                onPress={handleClear}
              >
                <ThemedText type="body" style={{ color: theme.error, fontWeight: "600" }}>
                  Clear
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.doneButton, { backgroundColor: theme.primary }]}
                onPress={handleDone}
              >
                <ThemedText type="body" style={{ color: "#fff", fontWeight: "600" }}>
                  Done
                </ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 56,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    justifyContent: "center",
  },
  label: {
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  keypadContainer: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl + 20,
  },
  keypadLabel: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  display: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: "flex-end",
  },
  displayText: {
    fontSize: 32,
  },
  keysContainer: {
    gap: Spacing.sm,
  },
  keyRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  key: {
    flex: 1,
    aspectRatio: 1.5,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  doneButton: {
    flex: 2,
  },
});
