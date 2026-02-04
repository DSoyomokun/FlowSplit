/**
 * SectionLabel Component
 * Uppercase section headers with consistent styling
 */

import React from 'react';
import { Text, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';

type SectionLabelSize = 'sm' | 'md' | 'lg';

interface SectionLabelProps {
  children: React.ReactNode;
  size?: SectionLabelSize;
  style?: TextStyle;
  containerStyle?: ViewStyle;
  color?: string;
}

export function SectionLabel({
  children,
  size = 'md',
  style,
  containerStyle,
  color,
}: SectionLabelProps) {
  const sizeStyles = getSizeStyles(size);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text
        style={[
          styles.text,
          sizeStyles,
          color ? { color } : undefined,
          style,
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

function getSizeStyles(size: SectionLabelSize): TextStyle {
  switch (size) {
    case 'sm':
      return {
        fontSize: FontSize.xs,
        letterSpacing: LetterSpacing.wider,
      };
    case 'md':
      return {
        fontSize: FontSize.sm,
        letterSpacing: LetterSpacing.widest,
      };
    case 'lg':
      return {
        fontSize: FontSize.base,
        letterSpacing: LetterSpacing.widest,
      };
    default:
      return {};
  }
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing[1],
  },
  text: {
    fontFamily: FontFamily.black,
    color: Colors.text.muted,
    textTransform: 'uppercase',
  },
});
