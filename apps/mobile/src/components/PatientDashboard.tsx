import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  VictoryChart,
  VictoryLine,
  VictoryTheme,
  VictoryAxis,
  VictoryScatter,
} from 'victory-native';

export interface VitalSignData {
  recordedAt: Date;
  value: number;
}

interface PatientDashboardProps {
  patientName: string;
  heartRateHistory: VitalSignData[];
  temperatureHistory: VitalSignData[];
}

export function PatientDashboard({
  patientName,
  heartRateHistory,
  temperatureHistory,
}: PatientDashboardProps) {
  // Formatage des données pour Victory
  const hrData = useMemo(
    () =>
      heartRateHistory.map((hr: any) => ({
        x: new Date(hr.recordedAt),
        y: hr.value,
      })),
    [heartRateHistory],
  );

  const tempData = useMemo(
    () =>
      temperatureHistory.map((t: any) => ({
        x: new Date(t.recordedAt),
        y: t.value,
      })),
    [temperatureHistory],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dossier de {patientName}</Text>

      {/* Graphique de la fréquence cardiaque */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Fréquence Cardiaque (bpm)</Text>
        <VictoryChart
          theme={VictoryTheme.material}
          height={200}
          padding={{ top: 20, bottom: 40, left: 40, right: 20 }}
        >
          <VictoryAxis
            tickFormat={(x: Date) => new Date(x).toLocaleDateString('fr-FR')}
          />
          <VictoryAxis dependentAxis />
          <VictoryLine
            style={{ data: { stroke: '#c43a31', strokeWidth: 2 } }}
            data={hrData}
          />
          <VictoryScatter
            data={hrData}
            size={4}
            style={{ data: { fill: '#c43a31' } }}
          />
        </VictoryChart>
      </View>

      {/* Graphique de température */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Température (°C)</Text>
        <VictoryChart
          theme={VictoryTheme.material}
          height={200}
          padding={{ top: 20, bottom: 40, left: 40, right: 20 }}
        >
          <VictoryAxis
            tickFormat={(x: Date) => new Date(x).toLocaleDateString('fr-FR')}
          />
          <VictoryAxis dependentAxis />
          <VictoryLine
            style={{ data: { stroke: '#3498db', strokeWidth: 2 } }}
            data={tempData}
          />
          <VictoryScatter
            data={tempData}
            size={4}
            style={{ data: { fill: '#3498db' } }}
          />
        </VictoryChart>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  chartContainer: {
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
  },
});
