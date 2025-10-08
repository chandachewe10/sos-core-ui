import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const LinearGradient = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-linear-gradient').LinearGradient;
  } catch (err) {
    return null;
  }
})();

let LucideIcons: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
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
      <View style={{ alignItems: 'center', marginVertical: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center' }}>
          Emergency SOS
        </Text>
        <Text style={{ fontSize: 16, color: 'white', marginTop: 4, textAlign: 'center' }}>
          Fast help when it matters most
        </Text>
      </View>

      <View style={styles.cards}>
        <Pressable style={styles.card} onPress={() => navigation.navigate('UserPhone')}>
          <View style={styles.iconWrap}>
            {UserIcon ? <UserIcon color="#0B1220" width={28} height={28} /> : <Text>U</Text>}
          </View>
          <Text style={styles.cardTitle}>Register as a User</Text>
          <Text style={styles.cardSub}>
            Quick phone OTP. Call for help from your location.
          </Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => navigation.navigate('StaffRegister')}>
          <View style={[styles.iconWrap, { backgroundColor: '#FFE8D6' }]}>
            {FirstAidIcon ? <FirstAidIcon color="#0B1220" width={28} height={28} /> : <Text>F</Text>}
          </View>
          <Text style={styles.cardTitle}>Register as Staff (Medical)</Text>
          <Text style={styles.cardSub}>
            Submit credentials, sign terms, and get approved to assist victims.
          </Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={() => navigation.navigate('StaffLogin')}
          style={styles.loginButton}
        >
          <Text style={[styles.loginText, { textAlign: 'center' }]}>
            Already registered? Login as staff
          </Text>

        </Pressable>
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
    <View style={[styles.container, { backgroundColor: '#0F172A', padding: 24, justifyContent: 'space-between' }]}>
      {Content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  header: { marginTop: 24 },
  title: { color: '#fff', fontSize: 36, fontWeight: '800', letterSpacing: 0.4 },
  subtitle: { color: '#A6B0C3', marginTop: 8 },
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
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#0B1220' },
  cardSub: { marginTop: 6, color: '#334155' },
  footer: { alignItems: 'center', marginBottom: 24 },
  loginButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  loginText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
