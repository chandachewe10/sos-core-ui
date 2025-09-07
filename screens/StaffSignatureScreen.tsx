import React, { useRef } from 'react';
import { View, StyleSheet, Pressable, Text, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner-native';

// Dynamically require signature canvas to avoid undefined component type errors
let Signature: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Signature = require('react-native-signature-canvas').default ?? require('react-native-signature-canvas');
} catch (err) {
  Signature = null;
}

export default function StaffSignatureScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { staffId } = route.params || {};
  const auth = useAuth();
  const ref = useRef<any>(null);

  function handleOK(signature: string) {
    // signature is base64 png data URL
    (async () => {
      try {
        await auth.submitStaffSignature(staffId, signature);
        toast.success('Signature saved — submitted for approval');
        navigation.navigate('StaffPending');
      } catch (err: any) {
        toast.error(err.message || 'Failed to save signature');
      }
    })();
  }

  function handleEmpty() {
    Alert.alert('Please sign before continuing');
  }

  async function saveWithoutCanvas() {
    Alert.alert('No signature canvas', 'Signature feature is not available in this environment. Do you want to submit without a signature?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Submit', style: 'destructive', onPress: async () => {
        try {
          // Send an empty placeholder or special flag to backend
          await auth.submitStaffSignature(staffId, '');
          toast.success('Submitted without signature — pending approval');
          navigation.navigate('StaffPending');
        } catch (err: any) {
          toast.error(err.message || 'Failed to submit');
        }
      } }
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign to confirm your details</Text>
      <View style={styles.pad}>
        {Signature ? (
          <Signature
            ref={ref}
            onOK={handleOK}
            onEmpty={handleEmpty}
            webStyle={style}
            descriptionText="Sign above"
            clearText="Clear"
            confirmText="Save"
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <Text style={{ textAlign: 'center', color: '#475569' }}>Signature pad not available in this environment.</Text>
            <Text style={{ textAlign: 'center', marginTop: 8, color: '#475569' }}>You may submit without signature and the admin will follow up.</Text>
            <Pressable style={{ marginTop: 12, padding: 12, backgroundColor: '#2563EB', borderRadius: 8 }} onPress={saveWithoutCanvas}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Submit without signature</Text>
            </Pressable>
          </View>
        )}
      </View>

      {Signature ? (
        <Pressable style={styles.smallButton} onPress={() => ref.current?.clearSignature?.()}>
          <Text>Clear</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const style = `.m-signature-pad--footer {display: none; margin: 0px;} body,html {height: 100%}`;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  pad: { flex: 1, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, overflow: 'hidden' },
  smallButton: { alignItems: 'center', padding: 12, marginTop: 12 },
});