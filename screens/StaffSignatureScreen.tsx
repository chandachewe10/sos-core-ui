import React, { useRef } from 'react';
import { View, StyleSheet, Pressable, Text, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as DB from '../lib/db';
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
  const { token, phone } = route.params || {};
  const ref = useRef<any>(null);

  async function handleOK(signature: string) {
    // signature is already a base64 data URL (data:image/png;base64,...)
    try {
      console.log('Phone Number before submitting signature:', phone);
      const result = await DB.submitStaffSignature({
  
        token,
        phone,
        signature, 
      });

      if (!result.ok) {
        throw new Error(result.data || result.message || 'Failed to save signature');
      }

      toast.success('Signature saved — submitted for approval');
      navigation.navigate('StaffPending');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save signature');
    }
  }

  function handleEmpty() {
    Alert.alert('Please sign before continuing');
  }

  async function saveWithoutCanvas() {
    Alert.alert(
      'No signature canvas',
      'Signature feature is not available in this environment. Do you want to submit without a signature?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'destructive',
          onPress: async () => {
            try {
               console.log('Phone Number on submitting signature:', phone);
              const result = await DB.submitStaffSignature({
                token,
                phone,
                signature: '', 
              });

              if (!result.ok) {
                throw new Error(result.data?.message || result.message || 'Failed to submit');
              }

              toast.success('Submitted without signature — pending approval');
              navigation.navigate('StaffPending');
            } catch (err: any) {
              toast.error(err.message || 'Failed to submit');
            }
          },
        },
      ]
    );
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
            descriptionText=""
            clearText="Clear"
            confirmText="Save Signature"
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <Text style={{ textAlign: 'center', color: '#475569' }}>
              Signature pad not available in this environment.
            </Text>
            <Text style={{ textAlign: 'center', marginTop: 8, color: '#475569' }}>
              You may submit without signature and the admin will follow up.
            </Text>
            <Pressable
              style={{ marginTop: 12, padding: 12, backgroundColor: '#2563EB', borderRadius: 8 }}
              onPress={saveWithoutCanvas}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Submit without signature</Text>
            </Pressable>
          </View>
        )}
      </View>

      {Signature ? (
        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.button, styles.clearButton]}
            onPress={() => ref.current?.clearSignature?.()}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.saveButton]}
            onPress={() => ref.current?.readSignature?.()}
          >
            <Text style={styles.saveButtonText}>Save Signature</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const style = `
  .m-signature-pad--footer {
    display: none;
  }
  .m-signature-pad {
    position: relative;
  }
  .m-signature-pad:before {
    content: 'SIGN HERE';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 48px;
    font-weight: 700;
    color: #E2E8F0;
    opacity: 0.3;
    pointer-events: none;
    letter-spacing: 4px;
  }
  body, html {
    height: 100%;
    margin: 0;
    padding: 0;
  }
  canvas {
    border: 2px dashed #CBD5E1;
  }
`;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#1E293B' },
  pad: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
  },
  clearButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  clearButtonText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#2563EB',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});