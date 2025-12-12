import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Linking } from 'react-native';
import * as DB from '../lib/db';
import { toast } from 'sonner-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SafetyCheckModal from '../components/SafetyCheckModal';
import MapLeaflet from './MapLeaflet';

interface TrackingPreferences {
    trackingEnabled: boolean;
    checkInIntervalMinutes: number | null;
}

export default function UserMapScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { phone, token } = route.params || {};
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [nearestStaff, setNearestStaff] = useState<any[]>([]);
    const [hasLocationError, setHasLocationError] = useState(false);
    const [trackingPreferences, setTrackingPreferences] = useState<TrackingPreferences | null>(null);
    const [safetyModalVisible, setSafetyModalVisible] = useState(false);
    const checkInTimerRef = useRef<NodeJS.Timeout | null>(null);
    const emergencyTriggeredRef = useRef(false);

    useEffect(() => {
        loadTrackingPreferences();
        requestLocationAndLoadStaff();
    }, []);

    const loadTrackingPreferences = async () => {
        try {
            const prefsString = await AsyncStorage.getItem(`tracking_preferences_${phone}`);
            if (prefsString) {
                const prefs: TrackingPreferences = JSON.parse(prefsString);
                setTrackingPreferences(prefs);

                if (prefs.trackingEnabled && prefs.checkInIntervalMinutes) {
                    startCheckInTimer(prefs.checkInIntervalMinutes);
                }
            }
        } catch (error) {
            console.error('Error loading tracking preferences:', error);
        }
    };

    const startCheckInTimer = (intervalMinutes: number) => {
        if (checkInTimerRef.current) {
            clearTimeout(checkInTimerRef.current);
        }

        const intervalMs = intervalMinutes * 60 * 1000;

        checkInTimerRef.current = setTimeout(() => {
            setSafetyModalVisible(true);
        }, intervalMs);
    };

    const handleThumbsUp = () => {
        emergencyTriggeredRef.current = false;
        if (trackingPreferences?.trackingEnabled && trackingPreferences?.checkInIntervalMinutes) {
            startCheckInTimer(trackingPreferences.checkInIntervalMinutes);
        }
        toast.success('Stay safe!');
    };

    const handleThumbsDown = () => {
        emergencyTriggeredRef.current = true;
        if (trackingPreferences?.trackingEnabled && trackingPreferences?.checkInIntervalMinutes) {
            setTimeout(() => {
                startCheckInTimer(trackingPreferences.checkInIntervalMinutes!);
                emergencyTriggeredRef.current = false;
            }, 60000);
        }
    };

    const handleModalClose = () => {
        setSafetyModalVisible(false);
        if (!emergencyTriggeredRef.current && trackingPreferences?.trackingEnabled && trackingPreferences?.checkInIntervalMinutes) {
            startCheckInTimer(trackingPreferences.checkInIntervalMinutes);
        }
    };

    const handleEnableTracking = async () => {
        navigation.navigate('TrackingPreferences', { phone, token });
    };

    useEffect(() => {
        return () => {
            if (checkInTimerRef.current) {
                clearTimeout(checkInTimerRef.current);
            }
        };
    }, []);

    const requestLocationAndLoadStaff = async () => {
        try {
            setHasLocationError(false);

            // Get user location from browser
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const userLocation = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        };
                        setLocation(userLocation);
                        const { latitude: userLat, longitude: userLon } = userLocation;

                        // Fetch staff from backend
                        const staffList = await DB.listActiveStaffs(token);

                        const staffWithLocation = staffList
                            .filter((s: any) => s.last_known_latitude && s.last_known_longitude)
                            .map((s: any) => ({
                                ...s,
                                last_known_latitude: parseFloat(s.last_known_latitude),
                                last_known_longitude: parseFloat(s.last_known_longitude),
                            }))
                            .filter((s: any) => !isNaN(s.last_known_latitude) && !isNaN(s.last_known_longitude));

                        const staffWithDistance = staffWithLocation.map((s: any) => ({
                            ...s,
                            distance: getDistanceFromLatLonInKm(userLat, userLon, s.last_known_latitude, s.last_known_longitude),
                        }));

                        const sortedStaff = staffWithDistance.sort((a, b) => a.distance - b.distance);
                        setNearestStaff(sortedStaff.slice(0, 5));
                        setLoading(false);
                    },
                    (error) => {
                        console.error('Geolocation error:', error);
                        setHasLocationError(true);
                        setLoading(false);
                    }
                );
            } else {
                setHasLocationError(true);
                setLoading(false);
            }
        } catch (err: any) {
            console.error('Error:', err);
            setHasLocationError(true);
            setLoading(false);
        }
    };

    function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
        const R = 6371;
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
        const confirmed = window.confirm(`Call ${staff.full_name}?\n\nPhone: ${staff.phone}`);
        if (confirmed) {
            Linking.openURL(`tel:${staff.phone}`);
        }
    };

    const callForHelp = async () => {
        if (!location) {
            window.alert('Error: Unable to get your location. Please try again.');
            return;
        }

        setSending(true);
        try {
            const helpData = {
                latitude: location.latitude,
                longitude: location.longitude,
                phone: phone,
                timestamp: new Date().toISOString(),
            };

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
                window.alert('Help Request Sent!\n\nYour emergency request has been sent. Help is on the way!\n\nNearest practitioner members have been notified of your location.');
            } else {
                throw new Error('Failed to send help request');
            }
        } catch (error: any) {
            console.error('Error sending help request:', error);
            toast.error('Failed to send help request. Please try again.');
            window.alert('Error: Failed to send emergency request. Please check your connection and try again.');
        } finally {
            setSending(false);
        }
    };

    const confirmCallForHelp = () => {
        const confirmed = window.confirm(
            'Emergency Help\n\nAre you sure you want to call for emergency help? This will notify all nearby staff members with your location.'
        );
        if (confirmed) {
            callForHelp();
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#EF4444" />
                <Text style={styles.loadingText}>Loading location and nearby practitioners...</Text>
            </View>
        );
    }

    if (hasLocationError || !location) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Unable to get location. Make sure you allow location access.</Text>
                <button
                    onClick={requestLocationAndLoadStaff}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#3B82F6',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 16,
                    }}
                >
                    Retry
                </button>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapLeaflet
                userLocation={location}
                staffMarkers={nearestStaff}
                onStaffSelect={callStaff}
            />

            {/* Track ME Button */}
            {trackingPreferences && !trackingPreferences.trackingEnabled && (
                <button
                    onClick={handleEnableTracking}
                    style={{
                        position: 'absolute',
                        top: 50,
                        left: 20,
                        padding: '8px 12px',
                        borderRadius: 20,
                        backgroundColor: '#10B981',
                        border: 'none',
                        cursor: 'pointer',
                        zIndex: 1000,
                        boxShadow: '0px 3px 5px rgba(0,0,0,0.3)',
                        fontSize: 12,
                        fontWeight: 'bold',
                        color: 'white',
                        textAlign: 'center',
                    }}
                >
                    📍 TRACK ME
                </button>
            )}

            {/* Big Red Help Button */}
            <button
                onClick={confirmCallForHelp}
                disabled={sending}
                style={{
                    position: 'absolute',
                    bottom: 30,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: sending ? '#9CA3AF' : '#EF4444',
                    color: 'white',
                    border: 'none',
                    padding: '20px 30px',
                    borderRadius: 15,
                    fontSize: 20,
                    fontWeight: 'bold',
                    cursor: sending ? 'default' : 'pointer',
                    zIndex: 1000,
                    boxShadow: '0px 4px 5px rgba(0,0,0,0.3)',
                    minWidth: 200,
                }}
            >
                {sending ? '⏳ Sending...' : '🚨 CALL FOR HELP'}
            </button>

            {/* Safety Check Modal */}
            <SafetyCheckModal
                visible={safetyModalVisible}
                onClose={handleModalClose}
                onThumbsUp={handleThumbsUp}
                onThumbsDown={handleThumbsDown}
                phone={phone}
                token={token}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 16, fontSize: 16 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: 'red', fontSize: 16, marginBottom: 10 },
    retryText: { color: 'blue', fontSize: 16 },

    helpButtonContainer: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        alignItems: 'center',
        zIndex: 1000,
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
    trackMeButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        minWidth: 80,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        zIndex: 1000,
    },
    trackMeIcon: {
        fontSize: 20,
        marginBottom: 2,
    },
    trackMeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
