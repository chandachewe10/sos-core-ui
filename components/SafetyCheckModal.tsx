import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';

interface SafetyCheckModalProps {
  visible: boolean;
  onClose: () => void;
  onThumbsUp: () => void;
  onThumbsDown: () => void;
  phone: string;
  token: string;
}

const RESPONSE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

export default function SafetyCheckModal({
  visible,
  onClose,
  onThumbsUp,
  onThumbsDown,
  phone,
  token,
}: SafetyCheckModalProps) {
  const [countdown, setCountdown] = useState(120); // 2 minutes in seconds
  const [responding, setResponding] = useState(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      // Reset countdown when modal opens
      setCountdown(120);
      setResponding(false);

      // Start countdown
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
            }
            handleAutoTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Set timeout for auto-response
      timeoutRef.current = setTimeout(() => {
        handleAutoTimeout();
      }, RESPONSE_TIMEOUT_MS);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible]);

  const handleAutoTimeout = async () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Auto-select thumbs down and trigger emergency
    setResponding(true);
    await triggerEmergencyHelp();
    onThumbsDown();
    // Close modal after a brief delay
    setTimeout(() => {
      onClose();
      setResponding(false);
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const triggerEmergencyHelp = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Location permission is required to send emergency help.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const helpData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
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
        Alert.alert(
          'Emergency Help Sent',
          'Your emergency request has been automatically sent. Help is on the way!',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Failed to send help request');
      }
    } catch (error: any) {
      console.error('Error sending emergency help:', error);
      Alert.alert(
        'Error',
        'Failed to send emergency request. Please try the emergency button manually.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleThumbsUp = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setResponding(true);
    onThumbsUp();
    // Close modal after a brief delay
    setTimeout(() => {
      onClose();
      setResponding(false);
    }, 500);
  };

  const handleThumbsDown = async () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setResponding(true);
    
    // Trigger emergency help
    await triggerEmergencyHelp();
    
    onThumbsDown();
    // Close modal after a brief delay
    setTimeout(() => {
      onClose();
      setResponding(false);
    }, 1000);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Are you okay?</Text>
          <Text style={styles.subtitle}>
            Please confirm your safety by selecting an option below.
          </Text>

          {countdown > 0 && !responding && (
            <Text style={styles.countdown}>
              Auto-response in: {formatTime(countdown)}
            </Text>
          )}

          {responding ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#EF4444" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          ) : (
            <View style={styles.buttonsContainer}>
              <Pressable
                style={[styles.emojiButton, styles.thumbsUpButton]}
                onPress={handleThumbsUp}
              >
                <Text style={styles.emoji}>👍</Text>
                <Text style={styles.buttonLabel}>I'm okay</Text>
              </Pressable>

              <Pressable
                style={[styles.emojiButton, styles.thumbsDownButton]}
                onPress={handleThumbsDown}
              >
                <Text style={styles.emoji}>👎</Text>
                <Text style={styles.buttonLabel}>I need help</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1F2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  countdown: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
  },
  emojiButton: {
    flex: 1,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    borderWidth: 3,
  },
  thumbsUpButton: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  thumbsDownButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  emoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});

