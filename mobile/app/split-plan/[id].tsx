import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as api from '@/services/api';
import { useBuckets } from '@/hooks';
import type { Deposit, SplitPlanPreview } from '@/types';

export default function SplitPlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { buckets } = useBuckets();
  const [deposit, setDeposit] = useState<Deposit | null>(null);
  const [preview, setPreview] = useState<SplitPlanPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    if (!id) return;
    try {
      setIsLoading(true);
      const [depositData, previewData] = await Promise.all([
        api.getDeposit(id),
        api.previewSplitPlan(id),
      ]);
      setDeposit(depositData);
      setPreview(previewData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load split plan');
      router.replace('/(tabs)');
    } finally {
      setIsLoading(false);
    }
  }

  function getBucketById(bucketId: string) {
    return buckets.find((b) => b.id === bucketId);
  }

  async function handleApprove() {
    if (!preview || !deposit) return;

    try {
      setIsSubmitting(true);
      const plan = await api.createSplitPlan({
        deposit_id: deposit.id,
        total_amount: preview.total_amount,
        actions: preview.actions,
      });
      await api.approveSplitPlan(plan.id);
      Alert.alert('Success', 'Split plan approved!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to approve');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!deposit || !preview) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.depositCard}>
          <Text style={styles.depositLabel}>Deposit Amount</Text>
          <Text style={styles.depositAmount}>${deposit.amount.toFixed(2)}</Text>
          {deposit.source && (
            <Text style={styles.depositSource}>{deposit.source}</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Split Preview</Text>

        {preview.actions.map((action) => {
          const bucket = getBucketById(action.bucket_id);
          if (!bucket) return null;

          const percentage = (action.amount / preview.total_amount) * 100;

          return (
            <View key={action.bucket_id} style={styles.actionCard}>
              <View style={styles.actionHeader}>
                <Text style={styles.bucketEmoji}>{bucket.emoji || '💰'}</Text>
                <View style={styles.bucketInfo}>
                  <Text style={styles.bucketName}>{bucket.name}</Text>
                  <Text style={styles.bucketAllocation}>
                    {bucket.bucket_type === 'percentage'
                      ? `${bucket.allocation_value}%`
                      : `$${bucket.allocation_value} fixed`}
                  </Text>
                </View>
                <Text style={styles.actionAmount}>${action.amount.toFixed(2)}</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${percentage}%` }]}
                />
              </View>
            </View>
          );
        })}

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>
            ${preview.actions.reduce((sum, a) => sum + a.amount, 0).toFixed(2)}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.cancelButton}
          onPress={() => router.replace('/(tabs)')}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.approveButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleApprove}
          disabled={isSubmitting}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.approveButtonText}>
            {isSubmitting ? 'Approving...' : 'Approve Split'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  depositCard: {
    backgroundColor: '#0a7ea4',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  depositLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 4,
  },
  depositAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  depositSource: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bucketEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  bucketInfo: {
    flex: 1,
  },
  bucketName: {
    fontSize: 16,
    fontWeight: '500',
  },
  bucketAllocation: {
    fontSize: 13,
    color: '#666',
  },
  actionAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0a7ea4',
    borderRadius: 3,
  },
  totalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  approveButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
