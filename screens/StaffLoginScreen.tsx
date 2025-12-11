import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { toast } from 'sonner-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import PusherService from '../services/PusherService';
import LocationService from '../services/LocationService';

export default function StaffLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  // ✅ REMOVED THE PROBLEMATIC useEffect THAT WAS DISCONNECTING PUSHER

  async function handleLogin() {
    if (!email || !password) return toast.error('Enter email and password');
    setLoading(true);

    try {
      // 1. Login
      const res = await fetch('https://sos.macroit.org/api/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      // 2. Store auth
      await AsyncStorage.setItem('staffToken', data.token);
      await AsyncStorage.setItem('staffUser', JSON.stringify(data.user));
      toast.success('Logged in successfully');
<<<<<<< HEAD

      // Initialize Pusher immediately after login so siren works
      // Use data.user.id (User model ID) - this matches Laravel's staffUserId
      const { pusherService } = await import('../services/PusherService');
      const staffUserId = data.user?.id; // This is the User model ID
      if (staffUserId) {
        console.log('🔌 Initializing Pusher after login for staff user ID:', staffUserId);
        await pusherService.initPusher(staffUserId.toString());
      } else {
        console.warn('⚠️ User ID not found in login response');
      }
      // Update users Current Location of user
=======
>>>>>>> 59de0a31ac9e00b93aea5664d3b26adce6fc0873

      // 3. Start real-time location updates (INDEPENDENT SERVICE)
      await LocationService.startLocationUpdates();
      console.log('📍 Real-time location updates started');

      // 4. Initialize Pusher for emergency alerts (SEPARATE SERVICE)
      if (data.user && data.user.id) {
        await PusherService.initPusher(data.user.id);
        console.log('✅ Pusher emergency listener activated');
      }

      // 5. Navigate
      navigation.reset({ index: 0, routes: [{ name: 'StaffDashboard' }] });

    } catch (err: any) {
      toast.error(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  }
  async function updateStaffLocation(token) {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast.error('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const formData = new FormData();
      formData.append('email', email);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());

      await fetch('https://sos.macroit.org/api/update-location', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      });

    } catch (error) {
      console.error('Location update error:', error);
    }
  }

  function handleForgotPassword() {
    navigation.navigate('ForgotPassword');
  }

  return (
    <View style={styles.container}>
<<<<<<< HEAD
      <Text style={styles.title}>Practitioner's Login</Text>

=======
      <Text style={styles.title}>Staff Login</Text>
>>>>>>> 59de0a31ac9e00b93aea5664d3b26adce6fc0873
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Pressable onPress={handleForgotPassword}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </Pressable>
      <Pressable
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleLogin}
        disabled={loading}
      >
<<<<<<< HEAD
        <Text style={styles.buttonText}>Practitioner's Login</Text>
=======
        <Text style={styles.buttonText}>
          {loading ? 'Logging in...' : 'Login'}
        </Text>
>>>>>>> 59de0a31ac9e00b93aea5664d3b26adce6fc0873
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  forgotText: {
    color: '#2563EB',
    textAlign: 'right',
    marginBottom: 16,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
});