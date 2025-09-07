import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as DB from '../lib/db';
import { toast } from 'sonner-native';

export default function UserPhoneScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  async function handleSendOtp() {
    if (!phone) return toast.error('Enter phone number');
    setLoading(true);
    try {
      const code = await DB.generateOtp(phone);
      toast.success('OTP generated (demo)');
      // For demo we show the OTP in a toast — in production this must be sent via SMS
      toast(`Demo OTP: ${code}`);
      navigation.navigate('UserOtp', { phone });
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate OTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter your phone number</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. +260977676767"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <Pressable style={[styles.button, loading && { opacity: 0.6 }]} onPress={handleSendOtp} disabled={loading}>
        <Text style={styles.buttonText}>Send OTP</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', padding: 12, borderRadius: 8, marginBottom: 12 },
  button: { backgroundColor: '#EF4444', padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});