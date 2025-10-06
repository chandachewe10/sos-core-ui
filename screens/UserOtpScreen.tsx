import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as DB from '../lib/db';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner-native';

export default function UserOtpScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { phone, token } = route.params || {};
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

async function handleVerify() {
  if (!phone) return toast.error('Missing phone number');
  if (otp.length !== 6) return toast.error('Enter 6-digit code');

  setLoading(true);
  try {
  
    const result = await DB.verifyOtp(phone, otp, token);
   console.log('Full OTP verify response:', result);
    if (result?.success === false || !result) {
      toast.error(result?.message || 'Invalid OTP');
      return;
    }

    toast.success('OTP verified successfully!');
    console.log('OTP Verified:', result.data);
    navigation.navigate('UserMap', { phone, token });
  } catch (err: any) {
    console.error('Verify OTP error:', err);
    toast.error(err.message || 'Failed to verify OTP');
  } finally {
    setLoading(false);
  }
}


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter OTP sent to your phone {phone}</Text>
      <TextInput
        style={styles.input}
        placeholder="123456"
        value={otp}
        onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 6))}
        keyboardType="phone-pad"
        maxLength={6}
      />
      <Pressable style={[styles.button, loading && { opacity: 0.6 }]} onPress={handleVerify} disabled={loading}>
        <Text style={styles.buttonText}>Verify</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 20, letterSpacing: 8 },
  button: { backgroundColor: '#10B981', padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});