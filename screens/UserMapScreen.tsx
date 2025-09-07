import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Platform, Linking } from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../hooks/useAuth';
import * as DB from '../lib/db';
import { toast } from 'sonner-native';

export default function UserMapScreen() {
  const auth = useAuth();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Dynamically load react-native-maps only on native platforms
  const [MapComponents, setMapComponents] = useState<{ MapView?: any; Marker?: any }>({});

  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        // require at runtime so web bundlers won't attempt to load native modules
        const RM = require('react-native-maps');
        // RM may export the MapView as default or named. Resolve both.
        const MapViewResolved = RM.default ?? RM;
        const MarkerResolved = RM.Marker ?? (RM.default && RM.default.Marker) ?? null;
        setMapComponents({ MapView: MapViewResolved, Marker: MarkerResolved });
      } catch (err) {
        console.warn('react-native-maps could not be loaded:', err);
      }
    }
  }, []);

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
      await DB.createSOS({ phone: auth.user.phone, location: { latitude: location.coords.latitude, longitude: location.coords.longitude }, createdAt: Date.now() });
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

  const { MapView: MapViewC, Marker: MarkerC } = MapComponents;

  // Web fallback: show static info and a link to open external maps
  if (Platform.OS === 'web' || !MapViewC) {
    const lat = location?.coords.latitude;
    const lng = location?.coords.longitude;
    const mapsUrl = lat && lng ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : undefined;

    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={{ fontWeight: '700', fontSize: 18 }}>Your Location</Text>
          <Text style={{ marginTop: 8 }}>{lat ? `${lat.toFixed(6)}, ${lng?.toFixed(6)}` : 'Unavailable'}</Text>
          {mapsUrl ? (
            <Pressable onPress={() => { Linking.openURL(mapsUrl); }} style={{ marginTop: 12, padding: 12, backgroundColor: '#2563EB', borderRadius: 10 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Open in Google Maps</Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable style={[styles.callButton, sending && { opacity: 0.7 }]} onPress={handleCallHelp} disabled={sending}>
          <Text style={styles.callText}>{sending ? 'Sending…' : 'Call for Help'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapViewC
        style={styles.map}
        initialRegion={{
          latitude: location!.coords.latitude,
          longitude: location!.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
      >
        {/* Only render Marker if the resolved Marker component exists */}
        {MarkerC ? (
          <MarkerC coordinate={{ latitude: location!.coords.latitude, longitude: location!.coords.longitude }} title="You" />
        ) : null}
      </MapViewC>

      <Pressable style={[styles.callButton, sending && { opacity: 0.7 }]} onPress={handleCallHelp} disabled={sending}>
        <Text style={styles.callText}>{sending ? 'Sending…' : 'Call for Help'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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