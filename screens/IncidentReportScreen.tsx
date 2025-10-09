import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { toast } from 'sonner-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function IncidentReportScreen() {
  const [caseId, setCaseId] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [outcome, setOutcome] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!caseId || !description) {
      return toast.error('Please fill required fields');
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('staffToken');
      const res = await fetch('https://sos.macroit.org/api/incident-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          case_id: caseId,
          description,
          severity,
          outcome,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit report');

      toast.success('Report submitted successfully');
      setCaseId('');
      setDescription('');
      setOutcome('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.formTitle}>Incident Report</Text>

      <Text style={styles.label}>Case ID *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter case ID"
        value={caseId}
        onChangeText={setCaseId}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Severity *</Text>
      <View style={styles.severityContainer}>
        {['low', 'medium', 'high', 'critical'].map((level) => (
          <Pressable
            key={level}
            style={[
              styles.severityBtn,
              severity === level && styles.severityBtnActive,
            ]}
            onPress={() => setSeverity(level)}
          >
            <Text style={[
              styles.severityText,
              severity === level && styles.severityTextActive,
            ]}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe what happened..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={6}
      />

      <Text style={styles.label}>Outcome</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Resolution or next steps..."
        value={outcome}
        onChangeText={setOutcome}
        multiline
        numberOfLines={4}
      />

      <Pressable
        style={[styles.submitButton, loading && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Submitting...' : 'Submit Report'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  severityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  severityBtn: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  severityBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  severityTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});