import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function StaffTermsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { token, phone } = route.params || {};

  function handleContinue() {
    navigation.navigate('StaffSignature', { phone, token });
     console.log('Phone Number after terms and conditions:', phone);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Terms & Conditions</Text>
      <Text style={styles.paragraph}>
        By registering as medical personnel you agree to provide accurate information and to respond to
        emergencies responsibly. You authorize the platform to share your contact and location with users who
        request assistance while your account is approved. Misuse may result in suspension.
      </Text>

      <Text style={styles.paragraph}>
        Please ensure you have valid certifications and that the documents you upload are legible. Approval may
        take up to 48 hours. This is a demo app — do not rely on it for real emergencies.
      </Text>

      <Pressable style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Accept & Sign</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  paragraph: { color: '#334155', marginBottom: 12, lineHeight: 20 },
  button: { backgroundColor: '#10B981', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontWeight: '700' },
});