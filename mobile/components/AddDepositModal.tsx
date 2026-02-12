/**
 * AddDepositModal Component
 * Bottom sheet modal for quickly adding a manual deposit
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Shadows } from '@/constants/shadows';
import { SpringConfig, Duration } from '@/constants/animations';
import { Button } from './Button';
import { AmountInput } from './AmountInput';

interface AddDepositModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (amount: number, description?: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function AddDepositModal({
  visible,
  onClose,
  onSubmit,
  isSubmitting = false,
}: AddDepositModalProps) {
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');

  const translateY = useSharedValue(300);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, SpringConfig.bouncy);
      opacity.value = withTiming(1, { duration: Duration.normal });
    } else {
      translateY.value = withTiming(300, { duration: Duration.fast });
      opacity.value = withTiming(0, { duration: Duration.fast });
    }
  }, [visible]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      const timer = setTimeout(() => {
        setAmount(0);
        setDescription('');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const canSubmit = amount > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmit(amount, description || undefined);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.modal, Shadows.modal, modalStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Deposit</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text.muted} />
            </Pressable>
          </View>

          {/* Amount Input */}
          <View style={styles.amountSection}>
            <AmountInput
              value={amount}
              onChange={setAmount}
              label="Amount"
              helperText="Enter the deposit amount"
              autoFocus
            />
          </View>

          {/* Description Input */}
          <View style={styles.descriptionSection}>
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g., Paycheck, Side gig, Gift..."
              placeholderTextColor={Colors.text.muted}
              style={styles.descriptionInput}
              maxLength={100}
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              onPress={handleSubmit}
              disabled={!canSubmit}
              loading={isSubmitting}
              icon={<Ionicons name="arrow-forward" size={18} color="white" />}
              iconPosition="right"
            >
              Add & Split
            </Button>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  modal: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.card,
    borderTopRightRadius: BorderRadius.card,
    padding: Spacing.cardLarge,
    paddingBottom: Spacing[12],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  title: {
    fontFamily: FontFamily.black,
    fontSize: 22,
    color: Colors.text.primary,
  },
  closeButton: {
    padding: Spacing[2],
  },
  amountSection: {
    marginBottom: Spacing[6],
  },
  descriptionSection: {
    marginBottom: Spacing[8],
  },
  label: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing[2],
  },
  descriptionInput: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.input,
    padding: Spacing[4],
    minHeight: 48,
  },
  actions: {
    gap: Spacing[3],
  },
  cancelButton: {
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text.muted,
  },
});
