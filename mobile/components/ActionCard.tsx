/**
 * ActionCard Component
 * Prominent card for manual actions (e.g., Pushpay links)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Shadows } from '@/constants/shadows';
import { Button } from './Button';

interface ActionCardProps {
  title: string;
  description: string;
  linkUrl?: string;
  linkLabel?: string;
  deadline?: string;
  onComplete?: () => void;
}

export function ActionCard({
  title,
  description,
  linkUrl,
  linkLabel = 'Open Link',
  deadline,
  onComplete,
}: ActionCardProps) {
  const [copied, setCopied] = React.useState(false);

  const handleOpenLink = async () => {
    if (linkUrl) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      try {
        await Linking.openURL(linkUrl);
        onComplete?.();
      } catch (error) {
        console.error('Failed to open URL:', error);
      }
    }
  };

  const handleCopyLink = async () => {
    if (linkUrl) {
      await Clipboard.setStringAsync(linkUrl);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Shorten URL for display
  const displayUrl = linkUrl
    ? linkUrl.replace(/^https?:\/\//, '').slice(0, 30) + (linkUrl.length > 30 ? '...' : '')
    : '';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="arrow-forward-circle"
            size={24}
            color={Colors.warning.text}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {linkUrl && (
          <Button
            onPress={handleOpenLink}
            variant="secondary"
            style={styles.primaryButton}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>{linkLabel}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.text.primary} />
            </View>
          </Button>
        )}

        {/* Copy Link Section */}
        {linkUrl && (
          <View style={styles.copySection}>
            <Text style={styles.copyLabel}>Or copy link manually</Text>
            <View style={styles.copyRow}>
              <TextInput
                value={displayUrl}
                editable={false}
                style={styles.copyInput}
                selectTextOnFocus
              />
              <Pressable onPress={handleCopyLink} style={styles.copyButton} hitSlop={8}>
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={18}
                  color={copied ? Colors.success.text : Colors.warning.text}
                />
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Deadline */}
      {deadline && (
        <View style={styles.deadlineContainer}>
          <Ionicons name="time-outline" size={14} color={Colors.warning.bgSolid} />
          <Text style={styles.deadlineText}>{deadline}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.warning.bg,
    borderWidth: 1,
    borderColor: Colors.warning.border,
    borderRadius: BorderRadius.card,
    padding: Spacing.card,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    gap: Spacing[4],
    marginBottom: Spacing[6],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: `${Colors.warning.bgSolid}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: Spacing[1],
  },
  title: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.lg,
    color: Colors.text.primary,
  },
  description: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.warning.textDark,
  },
  actions: {
    gap: Spacing[4],
  },
  primaryButton: {
    backgroundColor: Colors.text.primary,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  buttonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.card,
  },
  copySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: `${Colors.warning.border}50`,
    padding: Spacing[4],
  },
  copyLabel: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.widest,
    marginBottom: Spacing[2],
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  copyInput: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.text.muted,
    padding: 0,
  },
  copyButton: {
    padding: Spacing[1],
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginTop: Spacing[6],
    paddingTop: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: `${Colors.warning.border}50`,
  },
  deadlineText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.warning.textDark,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.tight,
  },
});
