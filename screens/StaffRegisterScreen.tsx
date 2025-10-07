import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { toast } from 'sonner-native';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import * as DB from '../lib/db';
import * as FileSystem from 'expo-file-system';

export default function StaffRegisterScreen() {
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hpczNumber, setHpczNumber] = useState('');
  const [nrcNumber, setNrcNumber] = useState('');
  const [nrcUri, setNrcUri] = useState<string | undefined>(undefined);
  const [selfieUri, setSelfieUri] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const auth = useAuth();
  const navigation = useNavigation<any>();

  async function pickImage(setter: (uri?: string) => void) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return toast.error('Permission required to pick images');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    // new ImagePicker returns assets
    // @ts-ignore
    const uri = result.assets?.[0]?.uri ?? result.uri;
    if (!uri) return;
    setter(uri);
  }

  

async function handleSubmit() {
  if (!phone || !fullName || !email || !address || !password || !hpczNumber || !nrcNumber)
    return toast.error('Please fill all required fields');
  if (password !== confirmPassword) return toast.error('Passwords do not match');
  if (!nrcUri || !selfieUri) return toast.error('Please upload NRC and selfie');

  setLoading(true);
  try {
    // ✅ Convert images to base64
    const nrcBase64 = await FileSystem.readAsStringAsync(nrcUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const selfieBase64 = await FileSystem.readAsStringAsync(selfieUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // ✅ Add proper MIME prefix for Laravel
    const nrcBase64String = `data:image/jpeg;base64,${nrcBase64}`;
    const selfieBase64String = `data:image/jpeg;base64,${selfieBase64}`;

    const ok = await DB.createStaff({
      phone,
      fullName,
      email,
      address,
      password,
      hpczNumber,
      nrcNumber,
      nrc: nrcBase64String,
      selfie: selfieBase64String,
    });

    console.log('Staff Registration Response:', ok);

    if (!ok || ok.status !== 201) {
      const errorMsg = ok?.data?.message || 'Failed to register staff';
      console.log('Staff Creation Error:', errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (ok.status === 201) {
      console.log('Full response data:', ok.data);

      const token = ok.data?.data?.access_token;
      setToken(token);
      console.log('Phone Number after creating staff:', phone);
      toast.success('Registration submitted');
      navigation.navigate('StaffTerms', { token, phone });
    }
  } catch (err: any) {
    console.error('Error submitting staff data:', err);
    toast.error(err.message || 'Failed to submit');
  } finally {
    setLoading(false);
  }
}

return (
  <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.title}>Staff Registration</Text>

    <TextInput style={styles.input} placeholder="Phone e.g. +26097..." value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor="#94A3B8" />
    <TextInput style={styles.input} placeholder="Full names" value={fullName} onChangeText={setFullName} placeholderTextColor="#94A3B8" />
    <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholderTextColor="#94A3B8" />
    <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} placeholderTextColor="#94A3B8" />
    <TextInput style={styles.input} placeholder="HPCZ Number" value={hpczNumber} onChangeText={setHpczNumber} placeholderTextColor="#94A3B8" />
    <TextInput style={styles.input} placeholder="NRC Number" value={nrcNumber} onChangeText={setNrcNumber} placeholderTextColor="#94A3B8" />
    <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#94A3B8" />
    <TextInput style={styles.input} placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholderTextColor="#94A3B8" />

    <View style={styles.uploadRow}>
      <Pressable style={styles.uploadBox} onPress={() => pickImage(setNrcUri)}>
        {nrcUri ? <Image source={{ uri: nrcUri }} style={styles.preview} /> : <Text>Upload NRC</Text>}
      </Pressable>

      <Pressable style={styles.uploadBox} onPress={() => pickImage(setSelfieUri)}>
        {selfieUri ? <Image source={{ uri: selfieUri }} style={styles.preview} /> : <Text>Upload Selfie</Text>}
      </Pressable>
    </View>

    <Pressable style={[styles.button, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
      <Text style={styles.buttonText}>{loading ? 'Submitting…' : 'Submit for Approval'}</Text>
    </Pressable>
  </ScrollView>
);
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    color: '#1E293B'
  },
  uploadRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 18 },
  uploadBox: { flex: 1, height: 120, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  preview: { width: '100%', height: '100%', borderRadius: 10 },
  button: { backgroundColor: '#2563EB', padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});