import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import * as DB from '../lib/db';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StaffDashboardScreen() {
  const auth = useAuth();
  const navigation = useNavigation<any>();
  const [soses, setSoses] = useState<any[]>([]);
  const [stats, setStats] = useState({
    active: 0,
    inProgress: 0,
    completed: 0,
  });
  const [staffUser, setStaffUser] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const list = await DB.listSOS();
    setSoses(list.filter((s: any) => s.status === 'active'));
    
    // Calculate stats
    setStats({
      active: list.filter((s: any) => s.status === 'active').length,
      inProgress: list.filter((s: any) => s.status === 'in-progress').length,
      completed: list.filter((s: any) => s.status === 'completed').length,
    });

    // Load staff user data
    const userData = await AsyncStorage.getItem('staffUser');
    if (userData) setStaffUser(JSON.parse(userData));
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header with Profile */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{staffUser?.name || 'Staff'}</Text>
        </View>
        <Pressable 
          onPress={() => navigation.navigate('StaffProfile')} 
          style={styles.profileBtn}
        >
          <Text style={styles.profileInitial}>
            {staffUser?.name?.charAt(0) || 'S'}
          </Text>
        </Pressable>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
          <Text style={styles.statNumber}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active SOS</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
          <Text style={styles.statNumber}>{stats.inProgress}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
          <Text style={styles.statNumber}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <Pressable 
          style={styles.actionCard}
          onPress={() => navigation.navigate('SOSAlerts')}
        >
          <Text style={styles.actionIcon}>🚨</Text>
          <Text style={styles.actionText}>SOS Alerts</Text>
        </Pressable>

        <Pressable 
          style={styles.actionCard}
          onPress={() => navigation.navigate('MyCases')}
        >
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionText}>My Cases</Text>
        </Pressable>

        <Pressable 
          style={styles.actionCard}
          onPress={() => navigation.navigate('IncidentReports')}
        >
          <Text style={styles.actionIcon}>📝</Text>
          <Text style={styles.actionText}>Reports</Text>
        </Pressable>

        <Pressable 
          style={styles.actionCard}
          onPress={() => navigation.navigate('Resources')}
        >
          <Text style={styles.actionIcon}>🛠️</Text>
          <Text style={styles.actionText}>Resources</Text>
        </Pressable>
      </View>

      {/* Recent Active SOS */}
      <Text style={styles.sectionTitle}>Recent Active Alerts</Text>
      {soses.slice(0, 3).map((item) => (
        <Pressable 
          key={item.id}
          style={styles.sosCard}
          onPress={() => navigation.navigate('SOSDetail', { sosId: item.id })}
        >
          <View style={styles.sosHeader}>
            <Text style={styles.sosPhone}>{item.phone}</Text>
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>URGENT</Text>
            </View>
          </View>
          <Text style={styles.sosLocation}>
            📍 {item.location?.latitude?.toFixed(4)}, {item.location?.longitude?.toFixed(4)}
          </Text>
          <Text style={styles.sosTime}>
            🕒 {new Date(item.createdAt).toLocaleString()}
          </Text>
        </Pressable>
      ))}

      {soses.length === 0 && (
        <Text style={styles.emptyText}>No active SOS alerts</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: { fontSize: 14, color: '#64748B' },
  userName: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  profileBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: { color: '#fff', fontSize: 20, fontWeight: '700' },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statNumber: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    marginRight: '2%',
  },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionText: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  sosCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  sosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sosPhone: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  urgentBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgentText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  sosLocation: { fontSize: 14, color: '#475569', marginBottom: 4 },
  sosTime: { fontSize: 12, color: '#94A3B8' },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 32,
  },
});

