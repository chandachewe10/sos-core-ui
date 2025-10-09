import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import * as DB from '../lib/db';

export default function MyCasesScreen() {
  const [activeTab, setActiveTab] = useState<'accepted' | 'in-progress' | 'completed'>('accepted');
  const [cases, setCases] = useState<any[]>([]);

  useEffect(() => {
    loadCases();
  }, [activeTab]);

  async function loadCases() {
    const allCases = await DB.listSOS();
    const filtered = allCases.filter((c: any) => {
      if (activeTab === 'accepted') return c.status === 'accepted';
      if (activeTab === 'in-progress') return c.status === 'in-progress';
      return c.status === 'completed';
    });
    setCases(filtered);
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <Pressable 
          style={[styles.tab, activeTab === 'accepted' && styles.activeTab]}
          onPress={() => setActiveTab('accepted')}
        >
          <Text style={[styles.tabText, activeTab === 'accepted' && styles.activeTabText]}>
            Accepted
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'in-progress' && styles.activeTab]}
          onPress={() => setActiveTab('in-progress')}
        >
          <Text style={[styles.tabText, activeTab === 'in-progress' && styles.activeTabText]}>
            In Progress
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={cases}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.caseCard}>
            <View style={styles.caseHeader}>
              <Text style={styles.caseId}>Case #{item.id}</Text>
              <View style={[
                styles.caseBadge,
                { backgroundColor: 
                  activeTab === 'completed' ? '#10B981' : 
                  activeTab === 'in-progress' ? '#F59E0B' : '#3B82F6'
                }
              ]}>
                <Text style={styles.caseBadgeText}>{activeTab}</Text>
              </View>
            </View>
            <Text style={styles.casePhone}>📞 {item.phone}</Text>
            <Text style={styles.caseLocation}>
              📍 {item.location?.latitude?.toFixed(4)}, {item.location?.longitude?.toFixed(4)}
            </Text>
            <Text style={styles.caseTime}>
              🕒 {new Date(item.createdAt).toLocaleString()}
            </Text>
            
            {activeTab !== 'completed' && (
              <Pressable style={styles.actionButton}>
                <Text style={styles.actionButtonText}>
                  {activeTab === 'accepted' ? 'Start Response' : 'Update Status'}
                </Text>
              </Pressable>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No {activeTab} cases</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: { backgroundColor: '#2563EB' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#fff' },
  caseCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  caseId: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  caseBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  caseBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  casePhone: { fontSize: 14, color: '#475569', marginBottom: 4 },
  caseLocation: { fontSize: 14, color: '#475569', marginBottom: 4 },
  caseTime: { fontSize: 12, color: '#94A3B8', marginBottom: 12 },
  actionButton: {
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 32,
  },
});