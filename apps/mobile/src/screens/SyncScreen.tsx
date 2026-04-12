import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type SyncScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Sync'>;

const QUEUE_STORAGE_KEY = '@resilient_health_sync_queue';

interface SyncTask {
  transactionId: string;
  priority: 'CRITICAL' | 'HIGH' | 'LOW';
  endpoint: string;
  queuedAtIso: string;
  retryCount: number;
}

export function SyncScreen() {
  const navigation = useNavigation<SyncScreenNavigationProp>();
  const [queue, setQueue] = useState<SyncTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const loadQueue = async () => {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setQueue(parsed);
      } else {
        setQueue([]);
      }
    } catch (error) {
      console.error('Failed to load queue', error);
    }
  };

  const handleManualSync = async () => {
    setLoading(true);
    // Simulate sync process
    setTimeout(() => {
      setLoading(false);
      setLastSync(new Date().toLocaleTimeString());
      Alert.alert('Synchronisation', 'Sync manuelle terminée.');
    }, 1500);
  };

  const clearQueue = async () => {
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
    setQueue([]);
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (iso: string) => new Date(iso).toLocaleTimeString();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Synchronisation</Text>
        <Text style={styles.subtitle}>État de la file d'attente hors-ligne</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{queue.length}</Text>
          <Text style={styles.statLabel}>Transactions en attente</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {queue.filter(t => t.priority === 'CRITICAL').length}
          </Text>
          <Text style={styles.statLabel}>Critiques</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {queue.filter(t => t.priority === 'HIGH').length}
          </Text>
          <Text style={styles.statLabel}>Hautes</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.syncButton} onPress={handleManualSync} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.syncButtonText}>🔁 Synchroniser maintenant</Text>
        )}
      </TouchableOpacity>

      {lastSync && (
        <View style={styles.lastSync}>
          <Text style={styles.lastSyncText}>Dernière sync: {lastSync}</Text>
        </View>
      )}

      {queue.length > 0 ? (
        <View style={styles.queueSection}>
          <View style={styles.queueHeader}>
            <Text style={styles.queueTitle}>File d'attente</Text>
            <TouchableOpacity onPress={clearQueue}>
              <Text style={styles.clearText}>Tout effacer</Text>
            </TouchableOpacity>
          </View>
          {queue.map((task) => (
            <View key={task.transactionId} style={styles.queueItem}>
              <View style={styles.queueItemHeader}>
                <Text style={styles.queueEndpoint}>{task.endpoint}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: task.priority === 'CRITICAL' ? '#ef4444' : task.priority === 'HIGH' ? '#f59e0b' : '#6b7280' }]}>
                  <Text style={styles.priorityText}>{task.priority}</Text>
                </View>
              </View>
              <Text style={styles.queueDetails}>ID: {task.transactionId}</Text>
              <Text style={styles.queueDetails}>Enregistré: {formatDate(task.queuedAtIso)}</Text>
              <Text style={styles.queueDetails}>Tentatives: {task.retryCount}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyQueue}>
          <Text style={styles.emptyQueueText}>Aucune transaction en attente.</Text>
          <Text style={styles.emptyQueueSubtext}>Toutes les données sont synchronisées.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  syncButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  lastSync: {
    alignItems: 'center',
    marginTop: 16,
  },
  lastSyncText: {
    fontSize: 14,
    color: '#64748b',
  },
  queueSection: {
    margin: 20,
    marginTop: 30,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  queueTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  clearText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  queueItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  queueItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  queueEndpoint: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  queueDetails: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  emptyQueue: {
    alignItems: 'center',
    padding: 40,
  },
  emptyQueueText: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 8,
  },
  emptyQueueSubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
});