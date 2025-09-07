import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Platform, Linking } from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../hooks/useAuth';
import * as DB from '../lib/db';
import { toast } from 'sonner-native';
import MapView, { Marker } from 'react-native-maps'; 

export default function UserMapScreen() {
  const auth = useAuth();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location permission is required to send your location to responders.');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      setLocation(loc);
      setLoading(false);
    })();
  }, []);

  async function handleCallHelp() {
    if (!auth.user || auth.user.role !== 'user') return toast.error('Not authenticated');
    if (!location) return toast.error('Location not available');
    setSending(true);
    try {
      await DB.createSOS({
        phone: auth.user.phone,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        },
        createdAt: Date.now()
      });
      toast.success('Help requested. Emergency responders will see your location.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send help request');
    } finally {
      setSending(false);
    }
  }

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color="#EF4444" />
      <Text style={{ marginTop: 12 }}>Fetching your location…</Text>
    </View>
  );

  // Web fallback
  if (Platform.OS === 'web' || !MapView) {
    const lat = location?.coords.latitude;
    const lng = location?.coords.longitude;
    const mapsUrl = lat && lng ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : undefined;

    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={{ fontWeight: '700', fontSize: 18 }}>Your Location</Text>
          <Text style={{ marginTop: 8 }}>{lat ? `${lat.toFixed(6)}, ${lng?.toFixed(6)}` : 'Unavailable'}</Text>
          {mapsUrl && (
            <Pressable
              onPress={() => Linking.openURL(mapsUrl)}
              style={styles.openMapsButton}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Open in Google Maps</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          style={[styles.callButton, sending && { opacity: 0.7 }]}
          onPress={handleCallHelp}
          disabled={sending}
        >
          <Text style={styles.callText}>{sending ? 'Sending…' : 'Call for Help'}</Text>
        </Pressable>
      </View>
    );
  }

  // Native map
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location!.coords.latitude,
          longitude: location!.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
      >
        <Marker
          coordinate={{
            latitude: location!.coords.latitude,
            longitude: location!.coords.longitude,
          }}
          title="You"
        />
      </MapView>

      <Pressable
        style={[styles.callButton, sending && { opacity: 0.7 }]}
        onPress={handleCallHelp}
        disabled={sending}
      >
        <Text style={styles.callText}>{sending ? 'Sending…' : 'Call for Help'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  openMapsButton: { marginTop: 12, padding: 12, backgroundColor: '#2563EB', borderRadius: 10, alignItems: 'center' },
  callButton: {
    position: 'absolute',
    bottom: 36,
    left: 24,
    right: 24,
    backgroundColor: '#EF4444',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  callText: { color: '#fff', fontWeight: '800', fontSize: 18 },
});
