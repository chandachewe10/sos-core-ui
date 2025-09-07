import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import * as DB from '../lib/db';

export default function AdminApproveScreen() {
  const [pending, setPending] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const list = await DB.listPendingStaff();
      setPending(list);
    })();
  }, []);

  async function handleApprove(id: string) {
    try {
      await DB.approveStaff(id);
      Alert.alert('Approved');
      setPending((p) => p.filter((x) => x.id !== id));
    } catch (err: any) {
      Alert.alert(err.message || 'Failed');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending Staff Approvals</Text>
      <FlatList
        data={pending}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.fullName} ({item.hpczNumber})</Text>
            <Text style={styles.small}>{item.email} • {item.phone}</Text>
            <Pressable style={styles.approve} onPress={() => handleApprove(item.id)}>
              <Text style={{ color: '#fff' }}>Approve</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text>No pending registrations</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 10 },
  name: { fontWeight: '800' },
  small: { color: '#64748B', marginTop: 6 },
  approve: { marginTop: 8, backgroundColor: '#10B981', padding: 8, borderRadius: 8, alignItems: 'center' },
});