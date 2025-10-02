import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../hooks/useAuth';
import * as DB from '../lib/db';
import { toast } from 'sonner-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';

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
  const [closestMedical, setClosestMedical] = useState<any | null>(null);
  const [hasLocationError, setHasLocationError] = useState(false);

  useEffect(() => {
    requestLocationAndSetup();
  }, []);

  const requestLocationAndSetup = async () => {
    try {
      console.log('Starting location setup...');
      setHasLocationError(false);
      
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Location permission status:', status);
      
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
        setHasLocationError(true);
        return;
      }

      // Get current location with high accuracy
      const currentLocation = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10,
      });
      
      console.log('Got location:', currentLocation?.coords);
      
      // Validate location data
      if (!currentLocation || !currentLocation.coords) {
        throw new Error('Invalid location data received');
      }
      
      setLocation(currentLocation);
      
      // Find the closest medical facility (for potential future use)
      const closest = MEDICAL_FACILITIES.reduce((prev, current) => {
        return (prev.distance < current.distance) ? prev : current;
      });
      
      console.log('Closest medical facility:', closest);
      setClosestMedical(closest);
      
    } catch (error) {
      console.error('Location error:', error);
      setHasLocationError(true);
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
    // if (!auth.user || auth.user.role !== 'user') {
    //   toast.error('Not authenticated');
    //   return;
    // }
    
    if (!location?.coords) {
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
    if (!location?.coords) {
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

  // Early return conditions
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EF4444" />
        <Text style={styles.loadingText}>Getting your location...</Text>
        <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
      </View>
    );
  }

  if (hasLocationError || !location || !location.coords) {
    console.log('No location available - hasError:', hasLocationError, 'location:', !!location);
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

  // At this point, we're guaranteed location and location.coords exist
  const userLatitude = location.coords.latitude;
  const userLongitude = location.coords.longitude;

  console.log('Rendering MapView with location:', { userLatitude, userLongitude });

  return (
    <View style={styles.container}>
      {/* Google Maps View */}
      <MapView
        style={styles.map}
      //  provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: userLatitude,
          longitude: userLongitude,
          latitudeDelta: 0.05, // Zoomed out more to show medical facilities
          longitudeDelta: 0.05,
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
            latitude: userLatitude,
            longitude: userLongitude,
          }}
          title="Your Location"
          description="You are here"
          pinColor="#2563EB"
        />
        
        {/* All medical facility markers with first aid emoji */}
        {MEDICAL_FACILITIES.map(facility => (
          <Marker
            key={facility.id}
            coordinate={{
              latitude: facility.latitude,
              longitude: facility.longitude,
            }}
          >
            <View style={styles.customMarker}>
              <Text style={styles.markerEmoji}>🩺</Text>
            </View>
            <Callout onPress={() => callMedicalFacility(facility.name)}>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>👨‍⚕️ {facility.name}</Text>
                <Text style={styles.calloutDescription}>
                  {facility.type} • {facility.distance} km away
                </Text>
                <Text style={styles.calloutTap}>Tap to call</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Open in Google Maps Button
      <Pressable style={styles.googleMapsButton} onPress={openInGoogleMaps}>
        <Text style={styles.googleMapsButtonText}>Open in Google Maps</Text>
      </Pressable> */}

      {/* Emergency Call Button */}
      <Pressable
        style={[styles.emergencyButton, sending && styles.emergencyButtonDisabled]}
        onPress={handleCallHelp}
        disabled={sending}
      >
        <Text style={styles.emergencyButtonText}>
          {sending ? 'Sending Emergency Alert...' : 'CALL FOR HELP'}
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
  customMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerEmoji: {
    fontSize: 18,
  },
  calloutContainer: {
    padding: 10,
    minWidth: 200,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  calloutTap: {
    fontSize: 12,
    color: '#2563EB',
    marginTop: 4,
  },
});