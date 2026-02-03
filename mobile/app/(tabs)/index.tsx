import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useBuckets, useDeposits } from '@/hooks';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { buckets, isLoading: bucketsLoading, refetch: refetchBuckets } = useBuckets();
  const { pendingDeposits, isLoading: depositsLoading, refetch: refetchDeposits } = useDeposits();

  const isLoading = bucketsLoading || depositsLoading;

  const totalBalance = buckets.reduce((sum, b) => sum + b.current_balance, 0);

  async function onRefresh() {
    await Promise.all([refetchBuckets(), refetchDeposits()]);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hello, {user?.full_name?.split(' ')[0] || 'there'}
        </Text>
        <Text style={styles.totalLabel}>Total Balance</Text>
        <Text style={styles.totalAmount}>${totalBalance.toFixed(2)}</Text>
      </View>

      {pendingDeposits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Splits</Text>
          {pendingDeposits.map((deposit) => (
            <Pressable
              key={deposit.id}
              style={styles.pendingCard}
              onPress={() => router.push(`/split-plan/${deposit.id}`)}
            >
              <View style={styles.pendingInfo}>
                <Ionicons name="cash" size={24} color="#F59E0B" />
                <View style={styles.pendingText}>
                  <Text style={styles.pendingAmount}>${deposit.amount.toFixed(2)}</Text>
                  <Text style={styles.pendingSource}>
                    {deposit.source || 'Deposit detected'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Buckets</Text>
          <Pressable onPress={() => router.push('/(tabs)/buckets')}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>
        {buckets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No buckets yet</Text>
            <Pressable
              style={styles.addButton}
              onPress={() => router.push('/(tabs)/buckets')}
            >
              <Text style={styles.addButtonText}>Add your first bucket</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.bucketsGrid}>
            {buckets.slice(0, 4).map((bucket) => (
              <View key={bucket.id} style={styles.bucketCard}>
                <Text style={styles.bucketEmoji}>{bucket.emoji || '💰'}</Text>
                <Text style={styles.bucketName} numberOfLines={1}>
                  {bucket.name}
                </Text>
                <Text style={styles.bucketBalance}>
                  ${bucket.current_balance.toFixed(2)}
                </Text>
                <Text style={styles.bucketAllocation}>
                  {bucket.bucket_type === 'percentage'
                    ? `${bucket.allocation_value}%`
                    : `$${bucket.allocation_value}`}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  header: {
    backgroundColor: '#0a7ea4',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  seeAll: {
    color: '#0a7ea4',
    fontWeight: '500',
  },
  pendingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pendingText: {
    gap: 2,
  },
  pendingAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  pendingSource: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  bucketsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bucketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
  },
  bucketEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  bucketName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  bucketBalance: {
    fontSize: 18,
    fontWeight: '600',
  },
  bucketAllocation: {
    fontSize: 12,
    color: '#666',
  },
});
