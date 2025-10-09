import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const LinearGradient = (() => {
  try {
    return require('expo-linear-gradient').LinearGradient;
  } catch (err) {
    return null;
  }
})();

let LucideIcons: any = null;
try {
  LucideIcons = require('lucide-react-native');
} catch (err) {
  LucideIcons = null;
}

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();
  const Gradient = LinearGradient as any;
  const Icons = LucideIcons as any;

  const UserIcon =
    Icons && (typeof Icons.User === 'function' ? Icons.User : Icons.User ?? null);
  const FirstAidIcon =
    Icons && (typeof Icons.FirstAidKit === 'function' ? Icons.FirstAidKit : Icons.FirstAidKit ?? null);

  const Content = (
    <>
      {/* Header */}
      <View style={{ alignItems: 'center', marginVertical: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center' }}>
          Emergency SOS
        </Text>
        <Text style={{ fontSize: 16, color: 'white', marginTop: 4, textAlign: 'center' }}>
          Fast help when it matters most
        </Text>
      </View>

      {/* Cards Section */}
      <View style={styles.cards}>
        {/* User Card */}
        <Pressable style={styles.card} onPress={() => navigation.navigate('UserPhone')}>
          <View style={styles.iconWrap}>
            {UserIcon ? <UserIcon color="#0B1220" width={28} height={28} /> : <Text>U</Text>}
          </View>
          <Text style={styles.cardTitle}>Sign in as a User</Text>

          <Text style={styles.cardSub}>
            Quick phone OTP. Call for help from your location.
          </Text>
        </Pressable>

        {/* Combined Staff Card */}
        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: '#FFE8D6' }]}>
            {FirstAidIcon ? <FirstAidIcon color="#0B1220" width={28} height={28} /> : <Text>F</Text>}
          </View>

          <Text style={styles.cardTitle}>Medical Staff Access</Text>
          <Text style={styles.cardSub}>
            Submit credentials, sign terms, and get approved to assist victims.
          </Text>

          <View style={styles.buttonGroup}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: '#0B1220' }]}
              onPress={() => navigation.navigate('StaffRegister')}
            >
              <Text style={styles.actionText}>Register as Staff</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, { backgroundColor: '#E6E6E6' }]}
              onPress={() => navigation.navigate('StaffLogin')}
            >
              <Text style={[styles.actionText, { color: '#0B1220' }]}>
                Already Registered? Login
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </>
  );

  if (Gradient) {
    return (
      <Gradient colors={['#0F172A', '#0B1220']} style={styles.container}>
        {Content}
      </Gradient>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#0F172A', padding: 24 }]}>
      {Content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  cards: { marginTop: 24, gap: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E6F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#0B1220', textAlign: 'center', },
  cardSub: { marginTop: 6, color: '#334155', marginBottom: 14 },
  buttonGroup: { gap: 10 },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
