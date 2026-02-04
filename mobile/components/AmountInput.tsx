/**
 * AmountInput Component
 * Currency input with formatting and validation
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { AmountDisplay } from './AmountDisplay';

interface AmountInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  helperText?: string;
  error?: string;
  style?: ViewStyle;
  autoFocus?: boolean;
}

export function AmountInput({
  value,
  onChange,
  min = 0,
  max = 999999.99,
  label = 'Deposit Amount',
  helperText,
  error,
  style,
  autoFocus = false,
}: AmountInputProps) {
  const [inputValue, setInputValue] = useState(value > 0 ? formatForInput(value) : '');
  const [isFocused, setIsFocused] = useState(autoFocus);
  const inputRef = React.useRef<TextInput>(null);

  const formatForInput = useCallback((num: number): string => {
    if (num === 0) return '';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }, []);

  const parseInput = useCallback((text: string): number => {
    // Remove all non-numeric characters except decimal
    const cleaned = text.replace(/[^0-9.]/g, '');

    // Handle multiple decimals
    const parts = cleaned.split('.');
    let result = parts[0];
    if (parts.length > 1) {
      result += '.' + parts[1].slice(0, 2);
    }

    const num = parseFloat(result) || 0;
    return Math.min(max, Math.max(min, num));
  }, [min, max]);

  const handleChangeText = (text: string) => {
    // Allow only numbers and one decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');

    // Prevent multiple decimal points
    const decimalCount = (cleaned.match(/\./g) || []).length;
    if (decimalCount > 1) return;

    // Limit decimal places to 2
    const parts = cleaned.split('.');
    if (parts[1] && parts[1].length > 2) return;

    setInputValue(cleaned);

    const numValue = parseInput(cleaned);
    onChange(numValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    Haptics.selectionAsync();
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format on blur
    if (value > 0) {
      setInputValue(formatForInput(value));
    }
  };

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const displayValue = value;
  const hasError = !!error || (value > 0 && value < min);
  const textColor = hasError ? Colors.error.bgSolid : Colors.text.primary;

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Amount Display (tappable) */}
      <Pressable onPress={handlePress} style={styles.displayContainer}>
        <AmountDisplay
          amount={displayValue}
          size="xl"
          showCursor={isFocused}
          color={textColor}
        />
      </Pressable>

      {/* Hidden Input */}
      <TextInput
        ref={inputRef}
        value={inputValue}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        keyboardType="decimal-pad"
        style={styles.hiddenInput}
        autoFocus={autoFocus}
        caretHidden
      />

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={Colors.error.bgSolid} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
    </View>
  );
}

function formatForInput(num: number): string {
  if (num === 0) return '';
  // Remove trailing zeros after decimal
  const formatted = num.toFixed(2);
  return formatted.replace(/\.?0+$/, '');
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing[4],
  },
  label: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: Spacing[4],
  },
  displayContainer: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginTop: Spacing[4],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    backgroundColor: Colors.error.bg,
    borderRadius: 12,
  },
  errorText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.error.bgSolid,
  },
  helperText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.text.muted,
    marginTop: Spacing[3],
    textAlign: 'center',
  },
});
