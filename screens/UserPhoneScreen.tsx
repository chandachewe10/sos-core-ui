import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as DB from '../lib/db';
import { toast } from 'sonner-native';

export default function UserPhoneScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();
  const [token, setToken] = useState('');

  async function handleSendOtp() {
  if (!phone) return toast.error('Enter phone number');
  setLoading(true);

  try {
    const ok = await DB.generateOtp(phone);


    // Check for validation or API failure
    if (!ok || ok.status !== 201) {
      const errorMsg =
        ok.data?.errors?.phone_number?.[0] ||
        ok.data?.message ||
        'Failed to generate OTP';

      console.log('OTP Error:', errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Successful case
    if (ok.status === 201) {
      console.log('Full response data:', ok.data);

      const token = ok.data?.data?.access_token;
      setToken(token);

      toast.success('OTP generated, check your phone');
      console.log('Registration successful:', token);
      navigation.navigate('UserOtp', { phone, token });
    }
  } catch (err: any) {
    const errorMessage =
      typeof err === 'object' && err !== null && 'message' in err
        ? (err as { message?: string }).message
        : undefined;

    console.error('OTP generation error:', err);
    toast.error(errorMessage || 'Failed to generate OTP');
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