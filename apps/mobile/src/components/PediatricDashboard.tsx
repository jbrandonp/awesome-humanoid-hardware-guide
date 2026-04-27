import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  VictoryChart,
  VictoryLine,
  VictoryTheme,
  VictoryAxis,
  VictoryScatter,
  VictoryArea,
} from 'victory-native';

export interface VitalSignData {
  recordedAt: Date;
  value: number; // Taille (cm) ou Poids (kg)
  ageInMonths: number;
}

interface PediatricDashboardProps {
  patientName: string;
  growthHistory: VitalSignData[];
}

export function PediatricDashboard({
  patientName,
  growthHistory,
}: PediatricDashboardProps) {
  // Données du patient formatées pour Victory
  const patientData = useMemo(
    () =>
      growthHistory.map((g: any) => ({
        x: g.ageInMonths,
        y: g.value,
      })),
    [growthHistory],
  );

  // --- MOCK : Courbes de Croissance OMS (Normes Internationales Simplifiées) ---
  // Exemple : Taille en cm pour les garçons de 0 à 24 mois
  const whoPercentile50 = [
    { x: 0, y: 50 },
    { x: 3, y: 61 },
    { x: 6, y: 68 },
    { x: 9, y: 72 },
    { x: 12, y: 76 },
    { x: 15, y: 79 },
    { x: 18, y: 82 },
    { x: 24, y: 87 },
  ];

  const whoPercentile3 = [
    // Limite inférieure critique
    { x: 0, y: 46 },
    { x: 3, y: 57 },
    { x: 6, y: 64 },
    { x: 9, y: 67 },
    { x: 12, y: 71 },
    { x: 15, y: 74 },
    { x: 18, y: 77 },
    { x: 24, y: 81 },
  ];

  const whoPercentile97 = [
    // Limite supérieure
    { x: 0, y: 54 },
    { x: 3, y: 65 },
    { x: 6, y: 72 },
    { x: 9, y: 76 },
    { x: 12, y: 81 },
    { x: 15, y: 84 },
    { x: 18, y: 87 },
    { x: 24, y: 93 },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dossier Pédiatrique: {patientName}</Text>

      {/* Graphique Dynamique : Courbe de Croissance OMS */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>
          Courbe de Taille (Normes OMS - Garçons)
        </Text>
        <VictoryChart
          theme={VictoryTheme.material}
          height={300}
          padding={{ top: 20, bottom: 40, left: 40, right: 20 }}
        >
          {/* Zone de normalité (entre 3e et 97e percentile) */}
          <VictoryArea
            style={{ data: { fill: '#e0f7fa', opacity: 0.5 } }}
            data={whoPercentile97}
            y0={(d: { x: number }) => whoPercentile3.find((p) => p.x === d.x)?.y || 0}
          />

          {/* Ligne Médiane OMS (50e percentile) */}
          <VictoryLine
            style={{
              data: {
                stroke: '#b0bec5',
                strokeWidth: 1,
                strokeDasharray: '5,5',
              },
            }}
            data={whoPercentile50}
          />

          {/* Ligne réelle du patient */}
          <VictoryLine
            style={{ data: { stroke: '#c43a31', strokeWidth: 3 } }}
            data={patientData}
          />
          <VictoryScatter
            data={patientData}
            size={5}
            style={{ data: { fill: '#c43a31' } }}
          />

          <VictoryAxis
            label="Âge (Mois)"
            style={{ axisLabel: { padding: 30 } }}
          />
          <VictoryAxis
            dependentAxis
            label="Taille (cm)"
            style={{ axisLabel: { padding: 30 } }}
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
