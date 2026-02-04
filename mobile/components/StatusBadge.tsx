/**
 * StatusBadge Component
 * Small status indicators for transaction states
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { SpinConfig } from '@/constants/animations';

export type StatusType =
  | 'success'
  | 'failed'
  | 'pending'
  | 'retrying'
  | 'manual'
  | 'processing';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function StatusBadge({
  status,
  label,
  showIcon = true,
  size = 'sm',
  style,
}: StatusBadgeProps) {
  const statusConfig = getStatusConfig(status);
  const displayLabel = label || statusConfig.defaultLabel;

  return (
    <View style={[styles.container, style]}>
      {showIcon && (
        <StatusIcon
          status={status}
          color={statusConfig.color}
          size={size === 'sm' ? 12 : 14}
        />
      )}
      <Text
        style={[
          styles.label,
          size === 'md' && styles.labelMd,
          { color: statusConfig.color },
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
}

interface StatusIconProps {
  status: StatusType;
  color: string;
  size: number;
}

function StatusIcon({ status, color, size }: StatusIconProps) {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    if (status === 'retrying' || status === 'processing' || status === 'pending') {
      rotation.value = withRepeat(
        withTiming(360, { duration: SpinConfig.duration }),
        -1,
        false
      );
    }
  }, [status]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const config = getStatusConfig(status);

  if (config.spinning) {
    return (
      <Animated.View style={animatedStyle}>
        <Ionicons name={config.icon} size={size} color={color} />
      </Animated.View>
    );
  }

  return <Ionicons name={config.icon} size={size} color={color} />;
}

function getStatusConfig(status: StatusType) {
  switch (status) {
    case 'success':
      return {
        color: Colors.success.text,
        icon: 'checkmark-circle' as const,
        defaultLabel: 'Auto-Completed',
        spinning: false,
      };
    case 'failed':
      return {
        color: Colors.error.text,
        icon: 'close-circle' as const,
        defaultLabel: 'Failed',
        spinning: false,
      };
    case 'pending':
      return {
        color: Colors.warning.text,
        icon: 'reload' as const,
        defaultLabel: 'Pending',
        spinning: true,
      };
    case 'retrying':
      return {
        color: Colors.warning.text,
        icon: 'reload' as const,
        defaultLabel: 'Retrying...',
        spinning: true,
      };
    case 'manual':
      return {
        color: Colors.warning.text,
        icon: 'arrow-forward' as const,
        defaultLabel: 'Manual Transfer Pending',
        spinning: false,
      };
    case 'processing':
      return {
        color: Colors.primary,
        icon: 'reload' as const,
        defaultLabel: 'Processing',
        spinning: true,
      };
    default:
      return {
        color: Colors.text.muted,
        icon: 'ellipse' as const,
        defaultLabel: '',
        spinning: false,
      };
  }
}

// Simpler dot indicator for allocation rows
interface StatusDotProps {
  color: string;
  size?: number;
  style?: ViewStyle;
}

export function StatusDot({ color, size = 8, style }: StatusDotProps) {
  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  label: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.tight,
  },
  labelMd: {
    fontSize: FontSize.sm,
  },
  dot: {
    // Base styles, actual size set inline
  },
});
