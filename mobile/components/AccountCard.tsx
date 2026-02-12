/**
 * AccountCard Component
 * Bank account display card with selection state
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { SpringConfig, AnimationValues } from '@/constants/animations';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Bank brand colors
const BANK_COLORS: Record<string, string> = {
  chase: '#117ACA',
  venmo: '#3D95CE',
  ally: '#6F2B91',
  capitalone: '#D12124',
  wellsfargo: '#D71E28',
  bofa: '#012169',
  default: Colors.primary,
};

interface AccountCardProps {
  id: string;
  name: string;
  type?: string;
  lastFour?: string;
  bankId?: string;
  selected?: boolean;
  onPress?: (id: string) => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export function AccountCard({
  id,
  name,
  type,
  lastFour,
  bankId = 'default',
  selected = false,
  onPress,
  style,
  disabled = false,
}: AccountCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(AnimationValues.cardPressScale, SpringConfig.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SpringConfig.snappy);
  };

  const handlePress = () => {
    if (disabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(id);
  };

  const bankColor = BANK_COLORS[bankId.toLowerCase()] || BANK_COLORS.default;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.container,
        selected && styles.selected,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {/* Bank Icon */}
      <View style={[styles.iconContainer, { backgroundColor: bankColor }]}>
        <Ionicons name="business" size={20} color="#FFFFFF" />
      </View>

      {/* Account Info */}
      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        {(type || lastFour) && (
          <Text style={styles.details}>
            {type}
            {type && lastFour && ' • '}
            {lastFour && `••${lastFour}`}
          </Text>
        )}
      </View>

      {/* Selection Indicator */}
      {selected ? (
        <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
      ) : (
        <View style={styles.unselectedCircle} />
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardMedium,
    padding: Spacing[5],
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    gap: Spacing[4],
  },
  selected: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: Spacing[0.5],
  },
  name: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  details: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.tight,
  },
  unselectedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border.light,
  },
});
