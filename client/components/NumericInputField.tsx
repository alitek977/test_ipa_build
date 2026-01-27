import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";

import { ThemedText } from "./ThemedText";
import { NumericKeypad } from "./NumericKeypad";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { formatWithCommas, stripCommas } from "@/lib/storage";

interface NumericInputFieldProps {
  label: string;
  value: string;
  onChangeValue: (value: string) => void;
  testID?: string;
}

export function NumericInputField({ label, value, onChangeValue, testID }: NumericInputFieldProps) {
  const { theme } = useTheme();
  const [showKeypad, setShowKeypad] = useState(false);

  const displayValue = formatWithCommas(stripCommas(value));

  const handleChangeValue = (newValue: string) => {
    onChangeValue(stripCommas(newValue));
  };

  return (
    <>
      <Pressable
        style={[
          styles.container,
          { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
        ]}
        onPress={() => setShowKeypad(true)}
        testID={testID}
      >
        <ThemedText type="caption" style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </ThemedText>
        <ThemedText
          type="body"
          style={[
            styles.value,
            { color: value ? theme.text : theme.textSecondary, fontFamily: Typography.mono.fontFamily },
          ]}
        >
          {displayValue || "0"}
        </ThemedText>
      </Pressable>

      <NumericKeypad
        visible={showKeypad}
        value={stripCommas(value)}
        onChangeValue={handleChangeValue}
        onClose={() => setShowKeypad(false)}
        label={label}
      />
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
});
