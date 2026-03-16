import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBuckets } from '@/hooks';

export default function BucketsScreen() {
  const router = useRouter();
  const { buckets, isLoading, refetch, deleteBucket } = useBuckets();

  const totalPercentage = buckets
    .filter((b) => b.bucket_type === 'percentage')
    .reduce((sum, b) => sum + b.allocation_value, 0);

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

      <Pressable style={styles.fab} onPress={() => router.push('/buckets/new')}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
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
    backgroundColor: '#0EA5A5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
