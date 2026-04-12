import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type VitalSignsScreenRouteProp = RouteProp<RootStackParamList, 'VitalSigns'>;
type VitalSignsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VitalSigns'>;

export function VitalSignsScreen() {
  const route = useRoute<VitalSignsScreenRouteProp>();
  const navigation = useNavigation<VitalSignsScreenNavigationProp>();
  const { patientId } = route.params;

  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [oxygenSaturation, setOxygenSaturation] = useState('');

  const handleSubmit = () => {
    // Validate inputs
    if (!systolic || !diastolic || !heartRate || !temperature) {
      Alert.alert('Données manquantes', 'Veuillez remplir les champs obligatoires.');
      return;
    }
    // TODO: Send to API
    console.log('Vitals submitted:', { systolic, diastolic, heartRate, temperature, respiratoryRate, oxygenSaturation });
    Alert.alert(
      'Succès',
      'Constantes vitales enregistrées.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nouvelles Constantes Vitales</Text>
        <Text style={styles.subtitle}>Patient ID: {patientId}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tension artérielle (mmHg)</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Systolique"
              keyboardType="numeric"
              value={systolic}
              onChangeText={setSystolic}
            />
            <Text style={styles.slash}>/</Text>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Diastolique"
              keyboardType="numeric"
              value={diastolic}
              onChangeText={setDiastolic}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fréquence cardiaque (bpm)</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: 72"
            keyboardType="numeric"
            value={heartRate}
            onChangeText={setHeartRate}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Température (°C)</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: 36.6"
            keyboardType="numeric"
            value={temperature}
            onChangeText={setTemperature}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fréquence respiratoire (rpm)</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: 16"
            keyboardType="numeric"
            value={respiratoryRate}
            onChangeText={setRespiratoryRate}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Saturation en O₂ (%)</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: 98"
            keyboardType="numeric"
            value={oxygenSaturation}
            onChangeText={setOxygenSaturation}
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Enregistrer</Text>
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
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  form: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  halfInput: {
    flex: 1,
  },
  slash: {
    fontSize: 20,
    marginHorizontal: 8,
    color: '#64748b',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});