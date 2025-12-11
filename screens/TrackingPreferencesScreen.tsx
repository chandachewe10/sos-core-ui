import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toast } from 'sonner-native';

const CHECK_IN_INTERVALS = [5, 10, 15, 30, 60]; // minutes

export default function TrackingPreferencesScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { phone, token } = route.params || {};
  
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (trackingEnabled && !selectedInterval) {
      return toast.error('Please select a check-in interval');
    }

    setLoading(true);
    try {
      const preferences = {
        trackingEnabled,
        checkInIntervalMinutes: trackingEnabled ? selectedInterval : null,
      };

      await AsyncStorage.setItem(
        `tracking_preferences_${phone}`,
        JSON.stringify(preferences)
      );

      toast.success(trackingEnabled ? 'Tracking enabled!' : 'Proceeding without tracking');
      navigation.navigate('UserMap', { phone, token });
    } catch (err: any) {
      console.error('Error saving preferences:', err);
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableTracking = () => {
    setTrackingEnabled(true);
  };

  const handleDisableTracking = () => {
    setTrackingEnabled(false);
    setSelectedInterval(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Track Me</Text>
      <Text style={styles.description}>
  When embarking on a journey practioners will keep an eye on you 
      </Text>

      <View style={styles.optionsContainer}>
        <Pressable
          style={[styles.optionButton, trackingEnabled && styles.optionButtonSelected]}
          onPress={handleEnableTracking}
        >
          <Text style={[styles.optionText, trackingEnabled && styles.optionTextSelected]}>
            Yes, enable TRACK ME
          </Text>
        </Pressable>

        <Pressable
          style={[styles.optionButton, !trackingEnabled && styles.optionButtonSelected]}
          onPress={handleDisableTracking}
        >
          <Text style={[styles.optionText, !trackingEnabled && styles.optionTextSelected]}>
            No, SKIP TRACK ME
          </Text>
        </Pressable>
      </View>

      {trackingEnabled && (
        <View style={styles.intervalContainer}>
          <Text style={styles.intervalLabel}>Check-in interval:</Text>
          <Text style={styles.intervalSubtext}>How many times should we check on you while on your journey?</Text>
          
          <View style={styles.intervalButtons}>
            {CHECK_IN_INTERVALS.map((interval) => (
              <Pressable
                key={interval}
                style={[
                  styles.intervalButton,
                  selectedInterval === interval && styles.intervalButtonSelected,
                ]}
                onPress={() => setSelectedInterval(interval)}
              >
                <Text
                  style={[
                    styles.intervalButtonText,
                    selectedInterval === interval && styles.intervalButtonTextSelected,
                  ]}
                >
                  {interval} min
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <Pressable
        style={[styles.continueButton, loading && { opacity: 0.6 }]}
        onPress={handleContinue}
        disabled={loading}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: '#1F2937',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    marginBottom: 30,
    gap: 12,
  },
  optionButton: {
    padding: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  optionTextSelected: {
    color: '#10B981',
  },
  intervalContainer: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  intervalLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1F2937',
  },
  intervalSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  intervalButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  intervalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    minWidth: 80,
    alignItems: 'center',
  },
  intervalButtonSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  intervalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  intervalButtonTextSelected: {
    color: '#10B981',
  },
  continueButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

