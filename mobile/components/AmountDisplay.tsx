/**
 * AmountDisplay Component
 * Large formatted currency display
 */

import React from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Duration } from '@/constants/animations';

type AmountSize = 'sm' | 'md' | 'lg' | 'xl';

interface AmountDisplayProps {
  amount: number;
  size?: AmountSize;
  showCursor?: boolean;
  color?: string;
  style?: ViewStyle;
  currencyStyle?: TextStyle;
  amountStyle?: TextStyle;
  showCents?: boolean;
}

export function AmountDisplay({
  amount,
  size = 'lg',
  showCursor = false,
  color,
  style,
  currencyStyle,
  amountStyle,
  showCents = true,
}: AmountDisplayProps) {
  const cursorOpacity = useSharedValue(1);

  React.useEffect(() => {
    if (showCursor) {
      cursorOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: Duration.slower }),
          withTiming(1, { duration: Duration.slower })
        ),
        -1,
        false
      );
    }
  }, [showCursor]);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  const sizeStyles = getSizeStyles(size);
  const textColor = color || Colors.text.primary;

  const formattedAmount = formatAmount(amount, showCents);

  return (
    <View style={[styles.container, style]}>
      <Text
        style={[
          styles.currency,
          sizeStyles.currency,
          { color: Colors.text.light },
          currencyStyle,
        ]}
      >
        $
      </Text>
      <Text
        style={[
          styles.amount,
          sizeStyles.amount,
          { color: textColor },
          amountStyle,
        ]}
      >
        {formattedAmount}
      </Text>
      {showCursor && (
        <Animated.Text
          style={[
            styles.cursor,
            sizeStyles.amount,
            { color: Colors.primary },
            cursorStyle,
          ]}
        >
          |
        </Animated.Text>
      )}
    </View>
  );
}

function formatAmount(amount: number, showCents: boolean): string {
  if (showCents) {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function getSizeStyles(size: AmountSize) {
  switch (size) {
    case 'sm':
      return {
        currency: { fontSize: FontSize.lg, marginRight: Spacing[1] } as TextStyle,
        amount: { fontSize: FontSize.xl } as TextStyle,
      };
    case 'md':
      return {
        currency: { fontSize: FontSize['2xl'], marginRight: Spacing[1] } as TextStyle,
        amount: { fontSize: 32 } as TextStyle,
      };
    case 'lg':
      return {
        currency: { fontSize: 30, marginRight: Spacing[2] } as TextStyle,
        amount: { fontSize: FontSize['3xl'] } as TextStyle,
      };
    case 'xl':
      return {
        currency: { fontSize: 36, marginRight: Spacing[2] } as TextStyle,
        amount: { fontSize: FontSize['4xl'] } as TextStyle,
      };
    default:
      return {
        currency: {} as TextStyle,
        amount: {} as TextStyle,
      };
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  currency: {
    fontFamily: FontFamily.black,
  },
  amount: {
    fontFamily: FontFamily.black,
  },
  cursor: {
    fontFamily: FontFamily.regular,
    marginLeft: 2,
  },
});

// Compact amount for cards/lists
interface CompactAmountProps {
  amount: number;
  color?: string;
  size?: 'sm' | 'md';
  style?: TextStyle;
}

export function CompactAmount({
  amount,
  color = Colors.text.primary,
  size = 'md',
  style,
}: CompactAmountProps) {
  const formatted = `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <Text
      style={[
        compactStyles.amount,
        size === 'sm' && compactStyles.amountSm,
        { color },
        style,
      ]}
    >
      {formatted}
    </Text>
  );
}

const compactStyles = StyleSheet.create({
  amount: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.md,
  },
  amountSm: {
    fontSize: FontSize.base,
  },
});
