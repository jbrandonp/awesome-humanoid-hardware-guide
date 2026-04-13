import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MedicalApi, Bed } from '../services/api';

type Patient = {
  id: string;
  name: string;
  age: number;
  room: string;
  lastVitalTime: string;
};

type PatientListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PatientList'>;



export function PatientListScreen() {
  const navigation = useNavigation<PatientListScreenNavigationProp>();
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const api = new MedicalApi(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000');

  useEffect(() => {
    const loadBeds = async () => {
      try {
        const bedsData = await api.getBeds();
        setBeds(bedsData);
      } catch (error) {
        console.error('Failed to load beds', error);
        Alert.alert('Erreur', 'Impossible de charger les lits.');
      } finally {
        setLoading(false);
      }
    };
    loadBeds();
  }, []);

  const patients = React.useMemo(() => {
    return beds
      .filter(bed => bed.status === 'OCCUPIED' && bed.patientName)
      .map(bed => ({
        id: bed.id,
        name: bed.patientName || 'Patient inconnu',
        age: 0, // Not available from bed data
        room: bed.roomNumber,
        lastVitalTime: '--',
      }));
  }, [beds]);

  const renderPatientItem = ({ item }: { item: Patient }) => (
    <TouchableOpacity
      style={styles.patientCard}
      onPress={() => navigation.navigate('PatientDetail', { patientId: item.id })}
    >
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientDetails}>Âge: {item.age} ans • Chambre: {item.room}</Text>
        <Text style={styles.patientDetails}>Dernières constantes: {item.lastVitalTime}</Text>
      </View>
      <View style={styles.indicator} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Chargement des patients...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={patients}
        renderItem={renderPatientItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: 16,
  },
  patientCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981', // green for stable
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
});