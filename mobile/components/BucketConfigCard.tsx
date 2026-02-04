/**
 * BucketConfigCard Component
 * Expanded bucket card with destination info and actions
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
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
import { Shadows } from '@/constants/shadows';
import { SpringConfig, AnimationValues } from '@/constants/animations';
import { ErrorBanner } from './ErrorBanner';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Bucket icons by type
const BUCKET_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  tithe: 'heart',
  savings: 'wallet',
  investing: 'trending-up',
  emergency: 'shield-checkmark',
  vacation: 'airplane',
  debt: 'card',
  default: 'layers',
};

interface BucketConfigCardProps {
  id: string;
  name: string;
  percentage: number;
  color: string;
  icon?: string;
  destination?: {
    name: string;
    type: 'bank' | 'external';
    lastFour?: string;
  };
  error?: {
    title: string;
    description: string;
    onReconnect?: () => void;
  };
  onPress?: (id: string) => void;
  onMorePress?: (id: string) => void;
  onDestinationPress?: (id: string) => void;
  style?: ViewStyle;
}

export function BucketConfigCard({
  id,
  name,
  percentage,
  color,
  icon,
  destination,
  error,
  onPress,
  onMorePress,
  onDestinationPress,
  style,
}: BucketConfigCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(AnimationValues.cardPressScale, SpringConfig.snappy);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SpringConfig.snappy);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(id);
  };

  const iconName = icon
    ? BUCKET_ICONS[icon.toLowerCase()] || BUCKET_ICONS.default
    : BUCKET_ICONS.default;

  const content = (
    <View style={[styles.container, error && styles.containerError, style]}>
      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <ErrorBanner
            variant="error"
            title={error.title}
            description={error.description}
            compact
            action={
              error.onReconnect
                ? { label: 'Reconnect', onPress: error.onReconnect }
                : undefined
            }
          />
        </View>
      )}

      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
            <Ionicons name={iconName} size={24} color={color} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.allocation}>{Math.round(percentage)}% Allocation</Text>
          </View>
        </View>

        {onMorePress && (
          <Pressable
            onPress={() => onMorePress(id)}
            hitSlop={8}
            style={styles.moreButton}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.text.muted} />
          </Pressable>
        )}
      </View>

      {/* Destination Row */}
      {destination && (
        <Pressable
          onPress={() => onDestinationPress?.(id)}
          style={[styles.destination, error && styles.destinationError]}
        >
          <View style={styles.destinationLeft}>
            <Ionicons
              name={destination.type === 'bank' ? 'business' : 'open-outline'}
              size={16}
              color={error ? Colors.error.text : Colors.text.muted}
            />
            <Text style={[styles.destinationText, error && styles.destinationTextError]}>
              {destination.name}
              {destination.lastFour && ` ••${destination.lastFour}`}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={error ? Colors.error.text : Colors.text.light}
          />
        </Pressable>
      )}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardMedium,
    padding: Spacing[5],
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    ...Shadows.card,
    gap: Spacing[4],
  },
  containerError: {
    // Error styling handled by inner banner
  },
  errorBanner: {
    marginHorizontal: -Spacing[5],
    marginTop: -Spacing[5],
    marginBottom: Spacing[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: Spacing[0.5],
  },
  name: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  allocation: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.text.muted,
  },
  moreButton: {
    padding: Spacing[1],
  },
  destination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
  },
  destinationError: {
    backgroundColor: Colors.error.bg,
    borderWidth: 1,
    borderColor: Colors.error.border,
  },
  destinationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  destinationText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.text.secondary,
  },
  destinationTextError: {
    color: Colors.error.text,
  },
});
