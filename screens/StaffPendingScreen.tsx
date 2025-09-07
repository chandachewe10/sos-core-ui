import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function StaffPendingScreen() {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Application Submitted</Text>
      <Text style={styles.paragraph}>Thank you. Your registration has been submitted and is pending approval. You will be notified once approved.</Text>
      <Pressable style={styles.button} onPress={() => navigation.navigate('Welcome')}>
        <Text style={styles.buttonText}>Return Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  paragraph: { textAlign: 'center', color: '#475569', marginBottom: 18 },
  button: { backgroundColor: '#2563EB', padding: 12, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: '700' },
});