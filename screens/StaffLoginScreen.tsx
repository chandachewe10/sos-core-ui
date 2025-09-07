import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { toast } from 'sonner-native';

export default function StaffLoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigation = useNavigation<any>();

  async function handleLogin() {
    if (!phone || !password) return toast.error('Enter phone and password');
    setLoading(true);
    try {
      await auth.loginStaff(phone, password);
      toast.success('Logged in');
      navigation.reset({ index: 0, routes: [{ name: 'StaffDashboard' }] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Staff Login</Text>
      <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Pressable style={[styles.button, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', padding: 12, borderRadius: 8, marginBottom: 12 },
  button: { backgroundColor: '#2563EB', padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});