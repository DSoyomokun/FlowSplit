/**
 * ErrorModal Component
 * Full-screen overlay modal for critical errors
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Shadows } from '@/constants/shadows';
import { SpringConfig, Duration } from '@/constants/animations';
import { Button } from './Button';

type ErrorModalIcon = 'wifi-off' | 'alert-circle' | 'close-circle' | 'warning';

interface ErrorModalProps {
  visible: boolean;
  icon?: ErrorModalIcon;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onPress: () => void;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  onClose?: () => void;
  dismissible?: boolean;
}

export function ErrorModal({
  visible,
  icon = 'wifi-off',
  title,
  description,
  primaryAction,
  secondaryAction,
  onClose,
  dismissible = true,
}: ErrorModalProps) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, SpringConfig.bouncy);
      opacity.value = withTiming(1, { duration: Duration.normal });
    } else {
      scale.value = withTiming(0.9, { duration: Duration.fast });
      opacity.value = withTiming(0, { duration: Duration.fast });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleBackdropPress = () => {
    if (dismissible && onClose) {
      onClose();
    }
  };

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    switch (icon) {
      case 'wifi-off':
        return 'wifi-outline';
      case 'alert-circle':
        return 'alert-circle';
      case 'close-circle':
        return 'close-circle';
      case 'warning':
        return 'warning';
      default:
        return 'alert-circle';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.modal, Shadows.modal, modalStyle]}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons
                name={getIconName()}
                size={40}
                color={Colors.error.bgSolid}
              />
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {primaryAction && (
              <Button onPress={primaryAction.onPress} variant="primary">
                {primaryAction.label}
              </Button>
            )}

            {secondaryAction && (
              <Pressable onPress={secondaryAction.onPress} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>{secondaryAction.label}</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.page,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  modal: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.cardLarge,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing[6],
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.error.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  title: {
    fontFamily: FontFamily.black,
    fontSize: 22,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  description: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.5,
  },
  actions: {
    width: '100%',
    gap: Spacing[3],
  },
  secondaryButton: {
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.muted,
  },
});
