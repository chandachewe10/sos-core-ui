import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as DB from '../lib/db';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toast } from 'sonner-native';

export default function SOSAlertsScreen() {
  const navigation = useNavigation<any>();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'urgent'>('all');

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  async function loadAlerts() {
    const list = await DB.listSOS();
    let filtered = list;
    
    if (filter === 'active') {
      filtered = list.filter((s: any) => s.status === 'active');
    } else if (filter === 'urgent') {
      filtered = list.filter((s: any) => s.priority === 'urgent' || s.status === 'active');
    }
    
    setAlerts(filtered);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  }

  async function handleAcceptCase(sosId: string) {
    try {
      const token = await AsyncStorage.getItem('staffToken');
      const res = await fetch(`https://sos.macroit.org/api/sos/${sosId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to accept case');

      toast.success('Case accepted successfully');
      loadAlerts();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function getTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <Pressable 
          style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.filterBtn, filter === 'active' && styles.filterBtnActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
            Active
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.filterBtn, filter === 'urgent' && styles.filterBtnActive]}
          onPress={() => setFilter('urgent')}
        >
          <Text style={[styles.filterText, filter === 'urgent' && styles.filterTextActive]}>
            Urgent
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(i) => i.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <Pressable 
            style={styles.alertCard}
            onPress={() => navigation.navigate('SOSDetail', { sosId: item.id })}
          >
            <View style={styles.alertHeader}>
              <View>
                <Text style={styles.alertPhone}>📞 {item.phone}</Text>
                <Text style={styles.alertTime}>{getTimeAgo(item.createdAt)}</Text>
              </View>
              {item.status === 'active' && (
                <View style={styles.activeBadge}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.activeText}>ACTIVE</Text>
                </View>
              )}
            </View>

            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>📍</Text>
              <View style={styles.locationInfo}>
                <Text style={styles.locationText}>
                  Lat: {item.location?.latitude?.toFixed(6)}
                </Text>
                <Text style={styles.locationText}>
                  Lng: {item.location?.longitude?.toFixed(6)}
                </Text>
              </View>
            </View>

            {item.notes && (
              <Text style={styles.notes} numberOfLines={2}>
                💬 {item.notes}
              </Text>
            )}

            <View style={styles.actionRow}>
              <Pressable 
                style={styles.viewBtn}
                onPress={() => navigation.navigate('SOSDetail', { sosId: item.id })}
              >
                <Text style={styles.viewBtnText}>View Details</Text>
              </Pressable>
              
              {item.status === 'active' && (
                <Pressable 
                  style={styles.acceptBtn}
                  onPress={() => handleAcceptCase(item.id)}
                >
                  <Text style={styles.acceptBtnText}>Accept Case</Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No SOS alerts found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'active' ? 'No active alerts at the moment' : 
               filter === 'urgent' ? 'No urgent alerts' : 
               'Pull down to refresh'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: '#F1F5F9',
  },
  filterBtnActive: {
    backgroundColor: '#2563EB',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#fff',
  },
  alertCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertPhone: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  activeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 13,
    color: '#475569',
    fontFamily: 'monospace',
  },
  notes: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  viewBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
  },
});

