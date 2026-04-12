import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type MedicationAdminScreenRouteProp = RouteProp<RootStackParamList, 'MedicationAdmin'>;
type MedicationAdminScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MedicationAdmin'>;

export function MedicationAdminScreen() {
  const route = useRoute<MedicationAdminScreenRouteProp>();
  const navigation = useNavigation<MedicationAdminScreenNavigationProp>();
  const { patientId } = route.params;

  const [medication, setMedication] = useState('');
  const [dose, setDose] = useState('');
  const [routeOfAdmin, setRouteOfAdmin] = useState('ORAL');
  const [notes, setNotes] = useState('');

  const handleScanBarcode = () => {
    // TODO: Integrate with barcode scanner
    Alert.alert('Scanner', 'Fonctionnalité de scan à implémenter.');
  };

  const handleSubmit = () => {
    if (!medication || !dose) {
      Alert.alert('Données manquantes', 'Veuillez spécifier le médicament et la dose.');
      return;
    }
    // TODO: Send to API
    console.log('Medication admin:', { medication, dose, routeOfAdmin, notes });
    Alert.alert(
      'Succès',
      'Administration enregistrée.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Administration de Médicaments</Text>
        <Text style={styles.subtitle}>Patient ID: {patientId}</Text>
      </View>

      <View style={styles.form}>
        <TouchableOpacity style={styles.scanButton} onPress={handleScanBarcode}>
          <Text style={styles.scanButtonText}>📷 Scanner le code-barres</Text>
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Médicament</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom ou DCI"
            value={medication}
            onChangeText={setMedication}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dose</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: 500 mg"
            value={dose}
            onChangeText={setDose}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Voie d'administration</Text>
          <View style={styles.routeButtons}>
            {['ORAL', 'IV', 'IM', 'SC', 'TOPICAL'].map((route) => (
              <TouchableOpacity
                key={route}
                style={[
                  styles.routeButton,
                  routeOfAdmin === route && styles.routeButtonSelected,
                ]}
                onPress={() => setRouteOfAdmin(route)}
              >
                <Text
                  style={[
                    styles.routeButtonText,
                    routeOfAdmin === route && styles.routeButtonTextSelected,
                  ]}
                >
                  {route}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes (optionnel)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Observations, réactions, etc."
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Enregistrer l'administration</Text>
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
  scanButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  scanButtonText: {
    fontSize: 16,
    color: '#475569',
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  routeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  routeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  routeButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  routeButtonText: {
    fontSize: 14,
    color: '#475569',
  },
  routeButtonTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#10b981',
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