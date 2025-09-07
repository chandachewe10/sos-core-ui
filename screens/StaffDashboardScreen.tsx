import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import * as DB from '../lib/db';
import { useAuth } from '../hooks/useAuth';

export default function StaffDashboardScreen() {
  const auth = useAuth();
  const [soses, setSoses] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const list = await DB.listSOS();
      setSoses(list);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Victims Calling for Help</Text>
        <Pressable onPress={() => auth.logout()} style={styles.logout}><Text style={{ color: '#fff' }}>Logout</Text></Pressable>
      </View>

      <FlatList
        data={soses}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.phone}>{item.phone}</Text>
            <Text style={styles.small}>Location: {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}</Text>
            <Text style={styles.small}>Requested: {new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ marginTop: 12 }}>No active requests</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '800' },
  logout: { backgroundColor: '#EF4444', padding: 8, borderRadius: 8 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10 },
  phone: { fontWeight: '800' },
  small: { color: '#475569', marginTop: 4 },
});