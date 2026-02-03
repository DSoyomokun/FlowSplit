import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useBuckets } from '@/hooks';
import { BucketColors } from '@/constants';

export default function BucketsScreen() {
  const { buckets, isLoading, refetch, createBucket, deleteBucket } = useBuckets();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [allocationType, setAllocationType] = useState<'percentage' | 'fixed'>('percentage');
  const [allocationValue, setAllocationValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPercentage = buckets
    .filter((b) => b.bucket_type === 'percentage')
    .reduce((sum, b) => sum + b.allocation_value, 0);

  async function handleCreate() {
    if (!name.trim() || !allocationValue) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const value = parseFloat(allocationValue);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Error', 'Please enter a valid allocation value');
      return;
    }

    if (allocationType === 'percentage' && totalPercentage + value > 100) {
      Alert.alert('Error', `Total percentage would exceed 100% (currently ${totalPercentage}%)`);
      return;
    }

    try {
      setIsSubmitting(true);
      await createBucket({
        name: name.trim(),
        emoji: emoji || undefined,
        color: BucketColors[buckets.length % BucketColors.length],
        bucket_type: allocationType,
        allocation_value: value,
      });
      setModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create bucket');
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setName('');
    setEmoji('');
    setAllocationType('percentage');
    setAllocationValue('');
  }

  function handleDelete(id: string, bucketName: string) {
    Alert.alert(
      'Delete Bucket',
      `Are you sure you want to delete "${bucketName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteBucket(id),
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {totalPercentage}% allocated ({100 - totalPercentage}% remaining)
          </Text>
        </View>

        {buckets.map((bucket) => (
          <View key={bucket.id} style={styles.bucketCard}>
            <View style={styles.bucketHeader}>
              <Text style={styles.bucketEmoji}>{bucket.emoji || '💰'}</Text>
              <View style={styles.bucketInfo}>
                <Text style={styles.bucketName}>{bucket.name}</Text>
                <Text style={styles.bucketAllocation}>
                  {bucket.bucket_type === 'percentage'
                    ? `${bucket.allocation_value}% of deposits`
                    : `$${bucket.allocation_value} per deposit`}
                </Text>
              </View>
              <Pressable
                style={styles.deleteButton}
                onPress={() => handleDelete(bucket.id, bucket.name)}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </Pressable>
            </View>
            <View style={styles.bucketFooter}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceAmount}>
                ${bucket.current_balance.toFixed(2)}
              </Text>
            </View>
          </View>
        ))}

        {buckets.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="pie-chart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No buckets yet</Text>
            <Text style={styles.emptyText}>
              Create buckets to automatically split your deposits
            </Text>
          </View>
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>New Bucket</Text>
            <Pressable onPress={handleCreate} disabled={isSubmitting}>
              <Text style={[styles.saveText, isSubmitting && styles.disabled]}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Emergency Fund"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Emoji (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 🏦"
              value={emoji}
              onChangeText={setEmoji}
              maxLength={2}
            />

            <Text style={styles.label}>Allocation Type</Text>
            <View style={styles.segmentedControl}>
              <Pressable
                style={[
                  styles.segment,
                  allocationType === 'percentage' && styles.segmentActive,
                ]}
                onPress={() => setAllocationType('percentage')}
              >
                <Text
                  style={[
                    styles.segmentText,
                    allocationType === 'percentage' && styles.segmentTextActive,
                  ]}
                >
                  Percentage
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.segment,
                  allocationType === 'fixed' && styles.segmentActive,
                ]}
                onPress={() => setAllocationType('fixed')}
              >
                <Text
                  style={[
                    styles.segmentText,
                    allocationType === 'fixed' && styles.segmentTextActive,
                  ]}
                >
                  Fixed Amount
                </Text>
              </Pressable>
            </View>

            <Text style={styles.label}>
              {allocationType === 'percentage' ? 'Percentage *' : 'Amount *'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={allocationType === 'percentage' ? 'e.g., 20' : 'e.g., 100'}
              value={allocationValue}
              onChangeText={setAllocationValue}
              keyboardType="decimal-pad"
            />
            {allocationType === 'percentage' && (
              <Text style={styles.hint}>
                {100 - totalPercentage}% remaining to allocate
              </Text>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  summary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryText: {
    textAlign: 'center',
    color: '#666',
  },
  bucketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  bucketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bucketEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  bucketInfo: {
    flex: 1,
  },
  bucketName: {
    fontSize: 16,
    fontWeight: '600',
  },
  bucketAllocation: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  bucketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  balanceLabel: {
    color: '#666',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
  },
  saveText: {
    color: '#0a7ea4',
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  modalContent: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: '#fff',
  },
  segmentText: {
    color: '#666',
  },
  segmentTextActive: {
    color: '#000',
    fontWeight: '500',
  },
});
