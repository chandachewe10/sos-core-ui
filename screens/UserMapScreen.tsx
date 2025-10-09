import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as DB from '../lib/db';
import { toast } from 'sonner-native';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function UserMapScreen() {

  const route = useRoute<any>();
  const { phone, token } = route.params || {};
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [nearestStaff, setNearestStaff] = useState<any[]>([]);
  const [hasLocationError, setHasLocationError] = useState(false);

  useEffect(() => {
    requestLocationAndLoadStaff();
  }, []);

  const requestLocationAndLoadStaff = async () => {
    try {
      setHasLocationError(false);

      // 1. Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is required to show nearby staff.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => Linking.openSettings() }
        ]);
        setLoading(false);
        setHasLocationError(true);
        return;
      }

      // 2. Get current user location
      const userLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(userLocation);

      const { latitude: userLat, longitude: userLon } = userLocation.coords;

      // 3. Fetch real staff from backend
      const staffList = await DB.listActiveStaffs(token);

      // Filter out staff without location and convert to numbers
      const staffWithLocation = staffList
        .filter((s: any) => s.last_known_latitude && s.last_known_longitude)
        .map((s: any) => ({
          ...s,
          last_known_latitude: parseFloat(s.last_known_latitude),
          last_known_longitude: parseFloat(s.last_known_longitude),
        }))
        .filter((s: any) => !isNaN(s.last_known_latitude) && !isNaN(s.last_known_longitude));

      console.log('staffs: ' + staffWithLocation.length)

      // 4. Calculate distance and sort by closest
      const staffWithDistance = staffWithLocation.map((s: any) => ({
        ...s,
        distance: getDistanceFromLatLonInKm(userLat, userLon, s.last_known_latitude, s.last_known_longitude),
      }));

      const sortedStaff = staffWithDistance.sort((a, b) => a.distance - b.distance);
      setNearestStaff(sortedStaff.slice(0, 5)); // Top 5 closest staff

    } catch (err: any) {
      console.error('Error:', err);
      setHasLocationError(true);
      Alert.alert('Error', 'Unable to get your location or staff data. Retry?', [
        { text: 'Retry', onPress: requestLocationAndLoadStaff },
        { text: 'Cancel', style: 'cancel' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Haversine formula to calculate distance in km
  function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const callStaff = (staff: any) => {
    Alert.alert(
      `Call ${staff.full_name}?`,
      `Phone: ${staff.phone}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${staff.phone}`) }
      ]
    );
  };

  const callForHelp = async () => {
    if (!location?.coords) {
      Alert.alert('Error', 'Unable to get your location. Please try again.');
      return;
    }

    setSending(true);
    try {

      const userPhone = phone;

      const helpData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        phone: userPhone,
        timestamp: new Date().toISOString(),

      };

      // Call your Laravel backend API
      const response = await fetch('https://sos.macroit.org/api/emergency-help', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(helpData),
      });

      if (response.ok) {
        toast.success('Help is on the way! Emergency services have been notified.');
        Alert.alert(
          'Help Request Sent!',
          'Your emergency request has been sent. Help is on the way!\n\nNearest staff members have been notified of your location.',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        throw new Error('Failed to send help request');
      }
    } catch (error: any) {
      console.error('Error sending help request:', error);
      toast.error('Failed to send help request. Please try again.');
      Alert.alert(
        'Error',
        'Failed to send emergency request. Please check your connection and try again.',
        [{ text: 'OK', style: 'cancel' }]
      );
    } finally {
      setSending(false);
    }
  };

  const confirmCallForHelp = () => {
    Alert.alert(
      'Emergency Help',
      'Are you sure you want to call for emergency help? This will notify all nearby staff members with your location.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call for Help',
          style: 'destructive',
          onPress: callForHelp
        }
      ]
    );
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#EF4444" />
      <Text style={styles.loadingText}>Loading location and staff...</Text>
    </View>
  );

  if (hasLocationError || !location?.coords) return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>Unable to get location.</Text>
      <Pressable onPress={requestLocationAndLoadStaff}><Text style={styles.retryText}>Retry</Text></Pressable>
    </View>
  );

  const { latitude, longitude } = location.coords;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
      >
        {nearestStaff.map(staff => (
          <Marker
            key={staff.id}
            coordinate={{
              latitude: staff.last_known_latitude,
              longitude: staff.last_known_longitude
            }}
            image={require('../assets/doctor-icon.png')}
          >
            <Callout onPress={() => callStaff(staff)}>
              <View style={{ minWidth: 200, padding: 10 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{staff.full_name}</Text>
                <Text>Distance: {staff.distance?.toFixed(2)} km</Text>
                <Text>Phone: {staff.phone}</Text>
                <Text style={{ color: 'blue', marginTop: 5 }}>Tap to call</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Big Red Help Button */}
      <View style={styles.helpButtonContainer}>
        <Pressable
          style={[styles.helpButton, sending && styles.helpButtonDisabled]}
          onPress={confirmCallForHelp}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.helpButtonText}>🚨 CALL FOR HELP</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red', fontSize: 16, marginBottom: 10 },
  retryText: { color: 'blue', fontSize: 16 },

  // Help Button Styles
  helpButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  helpButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 15,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    minWidth: 200,
    alignItems: 'center',
  },
  helpButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  helpButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});