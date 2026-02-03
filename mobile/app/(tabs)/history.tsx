import { Ionicons } from '@expo/vector-icons';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDeposits } from '@/hooks';

export default function HistoryScreen() {
  const { deposits, isLoading, refetch } = useDeposits();

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'processing':
        return '#3B82F6';
      case 'failed':
        return '#EF4444';
      default:
        return '#666';
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'processing':
        return 'sync';
      case 'failed':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      {deposits.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No deposits yet</Text>
          <Text style={styles.emptyText}>
            Your deposit history will appear here
          </Text>
        </View>
      ) : (
        deposits.map((deposit) => (
          <View key={deposit.id} style={styles.depositCard}>
            <View style={styles.depositHeader}>
              <View style={styles.amountContainer}>
                <Text style={styles.amount}>${deposit.amount.toFixed(2)}</Text>
                <Text style={styles.source}>
                  {deposit.source || 'Deposit'}
                </Text>
              </View>
              <View style={styles.statusContainer}>
                <Ionicons
                  name={getStatusIcon(deposit.status) as any}
                  size={20}
                  color={getStatusColor(deposit.status)}
                />
                <Text
                  style={[styles.status, { color: getStatusColor(deposit.status) }]}
                >
                  {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                </Text>
              </View>
            </View>
            <View style={styles.depositFooter}>
              <Text style={styles.date}>
                {formatDate(deposit.detected_at)}
              </Text>
              {deposit.description && (
                <Text style={styles.description} numberOfLines={1}>
                  {deposit.description}
                </Text>
              )}
            </View>
          </View>
        ))
      )}
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
  depositCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  depositHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  amountContainer: {
    flex: 1,
  },
  amount: {
    fontSize: 20,
    fontWeight: '600',
  },
  source: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  depositFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
