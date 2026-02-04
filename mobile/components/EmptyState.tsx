/**
 * EmptyState Component
 * Placeholder for empty lists/screens with action CTA
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Button } from './Button';

type EmptyStateIcon =
  | 'layers-outline'
  | 'wallet-outline'
  | 'time-outline'
  | 'search-outline'
  | 'document-outline';

interface EmptyStateProps {
  icon?: EmptyStateIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
  compact?: boolean;
}

export function EmptyState({
  icon = 'layers-outline',
  title,
  description,
  action,
  style,
  compact = false,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, compact && styles.compact, style]}>
      {/* Icon */}
      <View style={[styles.iconContainer, compact && styles.iconContainerCompact]}>
        <Ionicons
          name={icon}
          size={compact ? 48 : 64}
          color={Colors.gray[300]}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
        <Text style={[styles.description, compact && styles.descriptionCompact]}>
          {description}
        </Text>
      </View>

      {/* Action */}
      {action && (
        <View style={styles.actionContainer}>
          <Button
            onPress={action.onPress}
            variant="primary"
            size={compact ? 'md' : 'lg'}
          >
            {action.label}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[12],
    minHeight: 400,
  },
  compact: {
    minHeight: 250,
    paddingVertical: Spacing[6],
  },
  iconContainer: {
    marginBottom: Spacing[6],
  },
  iconContainerCompact: {
    marginBottom: Spacing[4],
  },
  content: {
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  title: {
    fontFamily: FontFamily.black,
    fontSize: 20,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  titleCompact: {
    fontSize: FontSize.lg,
  },
  description: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.5,
    maxWidth: 240,
  },
  descriptionCompact: {
    fontSize: FontSize.base,
    maxWidth: 200,
  },
  actionContainer: {
    width: '100%',
    maxWidth: 200,
  },
});

// Specific empty states for common scenarios
export function EmptyBuckets({ onCreateBucket }: { onCreateBucket: () => void }) {
  return (
    <EmptyState
      icon="layers-outline"
      title="No Buckets Yet"
      description="Create your first bucket to start automatically splitting your deposits."
      action={{
        label: 'Create Bucket',
        onPress: onCreateBucket,
      }}
    />
  );
}

export function EmptyHistory() {
  return (
    <EmptyState
      icon="time-outline"
      title="No Transactions"
      description="Your split history will appear here once you complete your first deposit split."
    />
  );
}

export function EmptySearch() {
  return (
    <EmptyState
      icon="search-outline"
      title="No Results"
      description="Try adjusting your search or filters to find what you're looking for."
      compact
    />
  );
}
