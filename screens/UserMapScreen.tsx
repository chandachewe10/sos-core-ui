import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../hooks/useAuth';
import * as DB from '../lib/db';
import { toast } from 'sonner-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

// Mock data for medical facilities (in a real app, you'd fetch this from an API)
const MEDICAL_FACILITIES = [
  {
    id: 1,
    name: "Dr Mike Mumba",
    latitude: -15.3875, // Lusaka, Zambia coordinates
    longitude: 28.3228,
    type: "Hospital",
    distance: 0.8
  },
  {
    id: 2,
    name: "Ms Mary Zimba Mwale",
    latitude: -15.3940,
    longitude: 28.3158,
    type: "Medical Center",
    distance: 1.2
  },
  {
    id: 3,
    name: "Dr Felix Kasuba",
    latitude: -15.3810,
    longitude: 28.3298,
    type: "Clinic",
    distance: 1.5
  },
  {
    id: 4,
    name: "Northside Hospital",
    latitude: -15.3745,
    longitude: 28.3355,
    type: "Hospital",
    distance: 2.1
  },
  {
    id: 5,
    name: "Westside Medical",
    latitude: -15.3945,
    longitude: 28.3098,
    type: "Clinic",
    distance: 2.3
  }
];

export default function UserMapScreen() {
  const auth = useAuth();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [nearestMedical, setNearestMedical] = useState<any[]>([]);

  useEffect(() => {
    requestLocationAndSetup();
  }, []);

  const requestLocationAndSetup = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to show your location and find nearby medical facilities.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() }
          ]
        );
        setLoading(false);
        return;
      }

      // Get current location with high accuracy
      const currentLocation = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10,
      });
      
      setLocation(currentLocation);
      
      // Calculate and set the nearest medical facilities
      const nearest = [...MEDICAL_FACILITIES]
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3);
      
      setNearestMedical(nearest);
      
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please check your GPS settings.',
        [
          { text: 'Retry', onPress: requestLocationAndSetup },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCallHelp = async () => {
    if (!auth.user || auth.user.role !== 'user') {
      toast.error('Not authenticated');
      return;
    }
    
    if (!location) {
      toast.error('Location not available');
      return;
    }

    setSending(true);
    
    try {
      await DB.createSOS({
        phone: auth.user.phone,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        createdAt: Date.now(),
      });
      
      toast.success('Help requested. Emergency responders will see your location soon.');
    } catch (err: any) {
      console.error('SOS creation error:', err);
      toast.error(err.message || 'Failed to send help request');
    } finally {
      setSending(false);
    }
  };

  const openInGoogleMaps = () => {
    if (!location) {
      toast.error('Location not available');
      return;
    }
    
    const { latitude, longitude } = location.coords;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    
    Linking.openURL(googleMapsUrl).catch(err => {
      console.error('Failed to open Google Maps:', err);
      toast.error('Could not open Google Maps');
    });
  };

  const callMedicalFacility = (facilityName: string) => {
    // In a real app, you would have phone numbers for each facility
    Alert.alert(
      'Call Medical Facility',
      `Would you like to call ${facilityName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => {
            // Replace with actual phone number
            // Linking.openURL('tel:+1234567890');
            toast.success(`Calling ${facilityName}...`);
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EF4444" />
        <Text style={styles.loadingText}>Getting your location...</Text>
        <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Location Unavailable</Text>
        <Text style={styles.errorText}>
          Unable to access your location. Please ensure GPS is enabled and location permissions are granted.
        </Text>
        <Pressable style={styles.retryButton} onPress={requestLocationAndSetup}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Google Maps View */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
      >
        {/* User location marker */}
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          title="Your Location"
          description="You are here"
          pinColor="#2563EB"
        />
        
        {/* Medical facility markers */}
        {nearestMedical.map(facility => (
          <Marker
            key={facility.id}
            coordinate={{
              latitude: facility.latitude,
              longitude: facility.longitude,
            }}
            title={facility.name}
            description={`${facility.type} • ${facility.distance} km away`}
            pinColor="#EF4444"
            onCalloutPress={() => callMedicalFacility(facility.name)}
          />
        ))}
      </MapView>

      {/* Open in Google Maps Button */}
      <Pressable style={styles.googleMapsButton} onPress={openInGoogleMaps}>
        <Text style={styles.googleMapsButtonText}>📍 Open in Google Maps</Text>
      </Pressable>

      {/* Medical Facilities Info Panel */}
      <View style={styles.medicalPanel}>
        <Text style={styles.medicalTitle}>Nearest Medical Staff</Text>
        {nearestMedical.map(facility => (
          <Pressable 
            key={facility.id} 
            style={styles.medicalItem}
            onPress={() => callMedicalFacility(facility.name)}
          >
            <View style={styles.medicalInfo}>
              <Text style={styles.medicalName}>{facility.name}</Text>
              <Text style={styles.medicalDetails}>
                {facility.type} • {facility.distance} km away
              </Text>
            </View>
            <Text style={styles.callIcon}>📞</Text>
          </Pressable>
        ))}
      </View>

      {/* Emergency Call Button */}
      <Pressable
        style={[styles.emergencyButton, sending && styles.emergencyButtonDisabled]}
        onPress={handleCallHelp}
        disabled={sending}
      >
        <Text style={styles.emergencyButtonText}>
          {sending ? 'Sending Emergency Alert...' : '🚨 CALL FOR HELP'}
        </Text>
        {sending && <ActivityIndicator size="small" color="#fff" style={styles.buttonLoader} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  googleMapsButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  googleMapsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  medicalPanel: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    maxHeight: 200,
  },
  medicalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  medicalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    marginBottom: 8,
  },
  medicalInfo: {
    flex: 1,
  },
  medicalName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  medicalDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  callIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  emergencyButton: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#EF4444',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  emergencyButtonDisabled: {
    opacity: 0.7,
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  buttonLoader: {
    marginLeft: 8,
  },
});