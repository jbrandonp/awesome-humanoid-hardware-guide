import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { PatientDashboard } from '../components/PatientDashboard';

type PatientDetailScreenRouteProp = RouteProp<RootStackParamList, 'PatientDetail'>;
type PatientDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PatientDetail'>;

export function PatientDetailScreen() {
  const route = useRoute<PatientDetailScreenRouteProp>();
  const navigation = useNavigation<PatientDetailScreenNavigationProp>();
  const { patientId } = route.params;

  // Mock data for patient
  const patientName = 'Jean Dupont';
  const heartRateHistory = [
    { recordedAt: new Date('2026-04-12T08:00:00'), value: 72 },
    { recordedAt: new Date('2026-04-12T10:00:00'), value: 75 },
    { recordedAt: new Date('2026-04-12T12:00:00'), value: 70 },
    { recordedAt: new Date('2026-04-12T14:00:00'), value: 68 },
    { recordedAt: new Date('2026-04-12T16:00:00'), value: 74 },
  ];
  const temperatureHistory = [
    { recordedAt: new Date('2026-04-12T08:00:00'), value: 36.6 },
    { recordedAt: new Date('2026-04-12T10:00:00'), value: 36.8 },
    { recordedAt: new Date('2026-04-12T12:00:00'), value: 37.0 },
    { recordedAt: new Date('2026-04-12T14:00:00'), value: 36.9 },
    { recordedAt: new Date('2026-04-12T16:00:00'), value: 36.7 },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dossier Patient</Text>
        <Text style={styles.patientId}>ID: {patientId}</Text>
      </View>

      <PatientDashboard
        patientName={patientName}
        heartRateHistory={heartRateHistory}
        temperatureHistory={temperatureHistory}
      />

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => navigation.navigate('VitalSigns', { patientId })}
        >
          <Text style={styles.buttonText}>Saisir Constantes Vitales</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('MedicationAdmin', { patientId })}
        >
          <Text style={styles.buttonText}>Administrer Médicaments</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  patientId: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  actions: {
    padding: 20,
  },
  button: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});